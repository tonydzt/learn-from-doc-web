import { createHash } from "crypto";

import {
  normalizeIndexSnapshot,
  normalizeRawProgress,
  type PortableData,
  type PortablePage,
  type PortableProgress,
  type PortableSiteBundle,
  type UploadIndexesRequest,
} from "./index-normalizer";
import type { createServerSupabaseClient } from "./supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type IndexSource = "system" | "user_upload";
type UserIndexRelationSource = "synced_system" | "uploaded";
type IndexReviewStatus = "none" | "pending" | "approved" | "rejected";
type SystemIndexStatus = "inactive" | "active";
type IndexAvailabilityKind = "system" | "user_upload" | "pending_review";

type DbIndex = {
  id: string;
  source?: IndexSource;
  owner_user_id?: string | null;
  site_id?: string;
  host?: string;
  scope_key?: string;
  scope_title?: string;
  schema_version?: number;
  version?: string;
  content_hash?: string | null;
  page_count?: number;
  index_snapshot?: unknown;
  indexed_at?: string;
  updated_at?: string;
  review_status?: IndexReviewStatus;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by_user_id?: string | null;
  review_note?: string | null;
  system_status?: SystemIndexStatus;
  approved_from_index_id?: string | null;
};

type DbUserIndex = {
  id: string;
  user_id?: string;
  index_id?: string;
  relation_source?: UserIndexRelationSource;
  synced_index_version?: string | null;
  updated_at?: string;
  indexes?: DbIndex | null;
};

type DbProgress = {
  user_index_id: string;
  site_id: string;
  url: string;
  title?: string | null;
  order?: number | null;
  content_height?: number | null;
  viewed_height: number;
  progress_percent?: number;
  raw_progress?: unknown;
  updated_at?: string;
};

type DbProgressWithId = DbProgress & {
  id?: string;
  index_page_id?: string | null;
  raw_progress_version?: number | null;
};

type DbIndexPage = {
  id: string;
  index_id: string;
  site_id: string;
  url: string;
  title: string;
  order?: number | null;
  content_height?: number | null;
  content_hash?: string | null;
  structure_hash?: string | null;
  updated_at?: string;
};

type DbIndexPageWithProgress = DbIndexPage & {
  user_page_progress?: DbProgressWithId[];
};

export type SystemIndexSnapshot = {
  schemaVersion: number;
  site: {
    siteId: string;
    host: string;
    scopeKey: string;
    scopeTitle: string;
  };
  pages: PortablePage[];
};

type IndexAvailabilityResponse =
  | { available: false }
  | {
      available: true;
      site: ReturnType<typeof availableIndexSite>;
      kinds: IndexAvailabilityKind[];
    };
type AvailableIndex = { kind: IndexAvailabilityKind; index: DbIndex };

export async function uploadUserIndexes(
  supabase: SupabaseClient,
  userId: string,
  request: UploadIndexesRequest,
) {
  const serverUpdatedAt = Date.now();

  for (const bundle of request.payload.sites) {
    const normalized = normalizeIndexSnapshot(bundle);
    const version = String(request.clientUpdatedAt || serverUpdatedAt);
    const contentHash = hashJson(bundle);
    const indexRow = await upsertIndex(supabase, {
      source: "user_upload",
      owner_user_id: userId,
      site_id: normalized.site.siteId,
      host: normalized.site.host,
      scope_key: normalized.site.scopeKey,
      scope_title: normalized.site.scopeTitle,
      schema_version: request.payload.schemaVersion,
      version,
      content_hash: contentHash,
      page_count: normalized.pages.length,
      index_snapshot: bundle,
      indexed_at: new Date(serverUpdatedAt).toISOString(),
    }, "source,owner_user_id,site_id");

    const pageRows = await upsertIndexPages(supabase, indexRow.id, normalized.pages);
    const userIndex = await upsertUserIndex(supabase, {
      user_id: userId,
      index_id: indexRow.id,
      relation_source: "uploaded",
      synced_index_version: null,
    });

    await upsertProgressRows(
      supabase,
      userId,
      userIndex.id,
      normalized.pages,
      bundle.progress ?? [],
      pageRows,
    );
  }

  return {
    ok: true,
    serverUpdatedAt,
    siteCount: request.payload.sites.length,
  };
}

export async function pullUserIndexes(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_indexes")
    .select("id,user_id,index_id,relation_source,synced_index_version,updated_at,indexes(*)")
    .eq("user_id", userId);

  if (error) {
    throw new Error("Could not load user indexes.");
  }

  const userIndexes = (data ?? []) as unknown as DbUserIndex[];

  if (userIndexes.length === 0) {
    return { ok: true, serverUpdatedAt: null, payload: null };
  }

  const userIndexIds = userIndexes.map((userIndex) => userIndex.id);
  const { data: progressData, error: progressError } = await supabase
    .from("user_page_progress")
    .select("*")
    .in("user_index_id", userIndexIds);

  if (progressError) {
    throw new Error("Could not load user progress.");
  }

  const progressByUserIndex = groupBy((progressData ?? []) as DbProgress[], "user_index_id");
  const sites = userIndexes.map((userIndex) =>
    assemblePortableSiteBundle(userIndex, progressByUserIndex.get(userIndex.id) ?? []),
  );
  const latestUpdatedAt = latestDate([
    ...userIndexes.map((userIndex) => userIndex.updated_at),
    ...((progressData ?? []) as DbProgress[]).map((progress) => progress.updated_at),
  ]);

  return {
    ok: true,
    serverUpdatedAt: latestUpdatedAt ? latestUpdatedAt.getTime() : null,
    payload: {
      schemaVersion: 1,
      exportedAt: Date.now(),
      scope: "all",
      includeProgress: true,
      sites,
    } satisfies PortableData,
  };
}

export async function getIndexAvailability(
  supabase: SupabaseClient,
  userId: string,
  siteId: string,
): Promise<IndexAvailabilityResponse> {
  const systemIndex = await findAvailableIndex(supabase, {
    source: "system",
    siteId,
  });

  const uploadedIndex = await findAvailableIndex(supabase, {
    source: "user_upload",
    siteId,
    ownerUserId: userId,
  });

  const availableIndexes: Array<AvailableIndex | null> = [
    systemIndex ? { kind: "system" as const, index: systemIndex } : null,
    uploadedIndex ? { kind: "user_upload" as const, index: uploadedIndex } : null,
  ];

  return availableIndexResponse(availableIndexes.filter(isAvailableIndex));
}

export async function getPendingReviewIndexAvailability(
  supabase: SupabaseClient,
  siteId: string,
): Promise<IndexAvailabilityResponse> {
  const pendingIndex = await findAvailableIndex(supabase, {
    source: "user_upload",
    siteId,
    reviewStatus: "pending",
  });

  if (pendingIndex) {
    return availableIndexResponse([{ kind: "pending_review", index: pendingIndex }]);
  }

  return { available: false };
}

export async function listAdminIndexes(
  supabase: SupabaseClient,
  filters: { source?: IndexSource; siteId?: string; host?: string; ownerUserId?: string } = {},
) {
  let query = supabase.from("indexes").select("*").order("updated_at", { ascending: false });

  if (filters.source) query = query.eq("source", filters.source);
  if (filters.siteId) query = query.eq("site_id", filters.siteId);
  if (filters.host) query = query.eq("host", filters.host);
  if (filters.ownerUserId) query = query.eq("owner_user_id", filters.ownerUserId);

  const { data, error } = await query;
  if (error) throw new Error("Could not load indexes.");

  return (data ?? []).map((row: DbIndex) => ({
    id: row.id,
    source: row.source,
    ownerUserId: row.owner_user_id ?? undefined,
    siteId: row.site_id,
    host: row.host,
    scopeKey: row.scope_key,
    scopeTitle: row.scope_title,
    schemaVersion: row.schema_version,
    version: row.version,
    contentHash: row.content_hash ?? undefined,
    pageCount: row.page_count ?? 0,
    userCount: 0,
    indexedAt: row.indexed_at,
    updatedAt: row.updated_at,
    reviewStatus: row.review_status ?? "none",
    systemStatus: row.system_status ?? "inactive",
    submittedAt: row.submitted_at ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNote: row.review_note ?? undefined,
    approvedFromIndexId: row.approved_from_index_id ?? undefined,
  }));
}

export async function listSystemAdminIndexes(
  supabase: SupabaseClient,
  filters: { siteId?: string; host?: string } = {},
) {
  return listAdminIndexes(supabase, { ...filters, source: "system" });
}

export async function listPendingReviewIndexes(
  supabase: SupabaseClient,
  filters: { siteId?: string; host?: string } = {},
) {
  let query = supabase
    .from("indexes")
    .select("*")
    .eq("source", "user_upload")
    .eq("review_status", "pending")
    .order("submitted_at", { ascending: true });

  if (filters.siteId) query = query.eq("site_id", filters.siteId);
  if (filters.host) query = query.eq("host", filters.host);

  const { data, error } = await query;
  if (error) throw new Error("Could not load pending index reviews.");

  return (data ?? []).map((row: DbIndex) => ({
    id: row.id,
    siteId: row.site_id,
    host: row.host,
    scopeKey: row.scope_key,
    scopeTitle: row.scope_title,
    version: row.version,
    pageCount: row.page_count ?? 0,
    submittedAt: row.submitted_at ?? row.updated_at,
    updatedAt: row.updated_at,
  }));
}

export async function getAdminIndexDetail(supabase: SupabaseClient, indexId: string) {
  const { data, error } = await supabase.from("indexes").select("*").eq("id", indexId).single();
  if (error) throw new Error("Could not load index.");

  return data;
}

export async function getSystemAdminIndexDetail(supabase: SupabaseClient, indexId: string) {
  const detail = await getAdminIndexDetail(supabase, indexId);

  if ((detail as DbIndex).source && (detail as DbIndex).source !== "system") {
    throw new Error("System index not found.");
  }

  return detail;
}

export async function getAdminIndexRawSnapshot(supabase: SupabaseClient, indexId: string) {
  const { data, error } = await supabase
    .from("indexes")
    .select("index_snapshot")
    .eq("id", indexId)
    .single();

  if (error) throw new Error("Could not load index snapshot.");

  return (data as { index_snapshot?: unknown }).index_snapshot;
}

export async function deleteAdminIndex(supabase: SupabaseClient, indexId: string) {
  const { error } = await supabase.from("indexes").delete().eq("id", indexId);

  if (error) throw new Error("Could not delete index.");
}

export async function listAdminIndexPages(
  supabase: SupabaseClient,
  indexId: string,
  options: { search?: string; orderBy?: "order" | "title" | "url" | "updated_at" } = {},
) {
  let query = supabase
    .from("index_pages")
    .select("*")
    .eq("index_id", indexId)
    .order(options.orderBy ?? "order", { ascending: true });

  if (options.search) {
    query = query.or(`title.ilike.%${options.search}%,url.ilike.%${options.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error("Could not load index pages.");

  return data ?? [];
}

export async function listSystemAdminIndexPages(
  supabase: SupabaseClient,
  indexId: string,
  options: { search?: string; orderBy?: "order" | "title" | "url" | "updated_at" } = {},
) {
  return listAdminIndexPages(supabase, indexId, options);
}

export async function getAdminIndexPageDetail(supabase: SupabaseClient, pageId: string) {
  const { data, error } = await supabase.from("index_pages").select("*").eq("id", pageId).single();

  if (error) throw new Error("Could not load index page.");

  return data;
}

export async function rebuildAdminIndexPages(
  supabase: SupabaseClient,
  indexId: string,
  pages: PortablePage[],
) {
  const { error } = await supabase.from("index_pages").delete().eq("index_id", indexId);
  if (error) throw new Error("Could not delete existing index pages.");

  return upsertIndexPages(supabase, indexId, pages);
}

export async function listAdminIndexUsers(supabase: SupabaseClient, indexId: string) {
  const { data, error } = await supabase
    .from("user_indexes")
    .select("*")
    .eq("index_id", indexId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Could not load index users.");

  return data ?? [];
}

export async function listAdminUserIndexes(
  supabase: SupabaseClient,
  filters: { userId?: string; indexId?: string } = {},
) {
  let query = supabase.from("user_indexes").select("*,indexes(*)").order("updated_at", { ascending: false });

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.indexId) query = query.eq("index_id", filters.indexId);

  const { data, error } = await query;
  if (error) throw new Error("Could not load user indexes.");

  return data ?? [];
}

export async function listAdminUserPageProgress(
  supabase: SupabaseClient,
  filters: { userId?: string; userIndexId?: string; indexPageId?: string; url?: string } = {},
) {
  let query = supabase.from("user_page_progress").select("*").order("updated_at", { ascending: false });

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.userIndexId) query = query.eq("user_index_id", filters.userIndexId);
  if (filters.indexPageId) query = query.eq("index_page_id", filters.indexPageId);
  if (filters.url) query = query.eq("url", filters.url);

  const { data, error } = await query;
  if (error) throw new Error("Could not load user page progress.");

  return data ?? [];
}

export async function submitUploadedIndexForReview(supabase: SupabaseClient, userId: string, indexId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("indexes")
    .update({
      review_status: "pending",
      submitted_at: now,
      reviewed_at: null,
      reviewed_by_user_id: null,
      review_note: null,
    })
    .eq("id", indexId)
    .eq("owner_user_id", userId)
    .eq("source", "user_upload");

  if (error) throw new Error("Could not submit index for review.");
}

export async function submitUploadedSiteForReview(supabase: SupabaseClient, userId: string, host: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("indexes")
    .update({
      review_status: "pending",
      submitted_at: now,
      reviewed_at: null,
      reviewed_by_user_id: null,
      review_note: null,
    })
    .eq("owner_user_id", userId)
    .eq("source", "user_upload")
    .eq("host", host)
    .in("review_status", ["none", "rejected"]);

  if (error) throw new Error("Could not submit site indexes for review.");
}

export async function approveIndexReview(
  supabase: SupabaseClient,
  reviewerUserId: string | null,
  indexId: string,
  reviewNote?: string,
) {
  const uploaded = await getAdminIndexDetail(supabase, indexId) as DbIndex;
  if (uploaded.source !== "user_upload") throw new Error("Only uploaded indexes can be approved.");
  if (uploaded.review_status !== "pending") throw new Error("Only pending indexes can be approved.");

  const pages = await listAdminIndexPages(supabase, indexId);
  const now = new Date().toISOString();
  const systemIndex = await insertIndex(supabase, {
    source: "system", owner_user_id: null, site_id: uploaded.site_id, host: uploaded.host,
    scope_key: uploaded.scope_key, scope_title: uploaded.scope_title, schema_version: uploaded.schema_version,
    version: uploaded.version, content_hash: uploaded.content_hash ?? null, page_count: uploaded.page_count ?? pages.length,
    index_snapshot: uploaded.index_snapshot, indexed_at: now, review_status: "approved", system_status: "inactive",
    approved_from_index_id: uploaded.id,
  });
  await upsertIndexPages(supabase, systemIndex.id, pages.map((page) => ({
    siteId: page.site_id, url: page.url, title: page.title, order: page.order ?? 0,
    contentHeight: page.content_height ?? undefined, contentHash: page.content_hash ?? undefined,
    structureHash: page.structure_hash ?? undefined,
  })));
  const { error } = await supabase.from("indexes").update({
    review_status: "approved", reviewed_at: now, reviewed_by_user_id: reviewerUserId, review_note: reviewNote || null,
  }).eq("id", indexId).eq("source", "user_upload").eq("review_status", "pending");
  if (error) throw new Error("Could not mark uploaded index as approved.");
  return systemIndex;
}

export async function approvePendingSiteReviews(
  supabase: SupabaseClient,
  reviewerUserId: string | null,
  host: string,
) {
  const pendingIndexes = await listPendingReviewIndexes(supabase, { host });

  await Promise.all(
    pendingIndexes.map((index) => approveIndexReview(supabase, reviewerUserId, index.id)),
  );

  return { approvedCount: pendingIndexes.length };
}

export async function rejectIndexReview(
  supabase: SupabaseClient,
  reviewerUserId: string | null,
  indexId: string,
  reviewNote?: string,
) {
  const { error } = await supabase.from("indexes").update({
    review_status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by_user_id: reviewerUserId,
    review_note: reviewNote || null,
  }).eq("id", indexId).eq("source", "user_upload");
  if (error) throw new Error("Could not reject index review.");
}

export async function markSystemIndexActive(supabase: SupabaseClient, indexId: string) {
  const index = await getAdminIndexDetail(supabase, indexId) as DbIndex;

  if (index.source !== "system" || !index.site_id) {
    throw new Error("System index not found.");
  }

  const { error: inactiveError } = await supabase
    .from("indexes")
    .update({ system_status: "inactive" })
    .eq("source", "system")
    .eq("site_id", index.site_id);

  if (inactiveError) throw new Error("Could not deactivate system index versions.");

  const { error: activeError } = await supabase
    .from("indexes")
    .update({ system_status: "active" })
    .eq("id", indexId)
    .eq("source", "system");

  if (activeError) throw new Error("Could not activate system index.");
}

export async function pullPendingReviewIndex(supabase: SupabaseClient, siteId: string) {
  const { data, error } = await supabase
    .from("indexes")
    .select("*")
    .eq("source", "user_upload")
    .eq("review_status", "pending")
    .eq("site_id", siteId)
    .order("submitted_at", { ascending: true })
    .limit(1);

  if (error) throw new Error("Could not load pending index review.");

  const index = ((data ?? []) as DbIndex[])[0];
  if (!index) {
    return { ok: true, serverUpdatedAt: null, payload: null };
  }

  return {
    ok: true,
    serverUpdatedAt: index.updated_at ? new Date(index.updated_at).getTime() : null,
    payload: {
      schemaVersion: 1,
      exportedAt: Date.now(),
      scope: "site",
      includeProgress: false,
      sites: [assemblePortableSiteBundle({ id: `review:${index.id}`, indexes: index }, [])],
    } satisfies PortableData,
  };
}

export async function clearUserIndexProgress(supabase: SupabaseClient, userId: string, userIndexId: string) {
  const { error } = await supabase
    .from("user_page_progress")
    .delete()
    .eq("user_id", userId)
    .eq("user_index_id", userIndexId);

  if (error) throw new Error("Could not clear user index progress.");
}

export async function clearUserPageProgress(supabase: SupabaseClient, userId: string, userIndexId: string, url: string) {
  const { error } = await supabase
    .from("user_page_progress")
    .delete()
    .eq("user_id", userId)
    .eq("user_index_id", userIndexId)
    .eq("url", url);

  if (error) throw new Error("Could not clear user page progress.");
}

export async function unlinkCurrentUserIndex(supabase: SupabaseClient, userId: string, userIndexId: string) {
  const { error } = await supabase
    .from("user_indexes")
    .delete()
    .eq("user_id", userId)
    .eq("id", userIndexId);

  if (error) throw new Error("Could not unlink user index.");
}

export async function deleteCurrentUserUploadedIndex(supabase: SupabaseClient, userId: string, indexId: string) {
  const { error } = await supabase
    .from("indexes")
    .delete()
    .eq("id", indexId)
    .eq("owner_user_id", userId)
    .eq("source", "user_upload");

  if (error) throw new Error("Could not delete uploaded index.");
}

export async function listCurrentUserIndexes(supabase: SupabaseClient, userId: string) {
  const { data: userIndexesData, error } = await supabase
    .from("user_indexes")
    .select("id,user_id,index_id,relation_source,synced_index_version,updated_at,indexes(id,source,site_id,host,scope_key,scope_title,page_count,review_status,submitted_at,reviewed_at,review_note)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Could not load current user indexes.");

  return ((userIndexesData ?? []) as unknown as DbUserIndex[]).map((userIndex) => {
    const index = userIndex.indexes;

    return {
      id: userIndex.id,
      indexId: userIndex.index_id ?? index?.id ?? "",
      relationSource: userIndex.relation_source ?? "uploaded",
      syncedIndexVersion: userIndex.synced_index_version ?? undefined,
      siteId: index?.site_id ?? "",
      host: index?.host ?? "",
      scopeKey: index?.scope_key ?? "",
      scopeTitle: index?.scope_title ?? "",
      indexSource: index?.source ?? "user_upload",
      pageCount: index?.page_count ?? 0,
      updatedAt: userIndex.updated_at ?? "",
      reviewStatus: index?.review_status ?? "none",
      submittedAt: index?.submitted_at ?? undefined,
      reviewedAt: index?.reviewed_at ?? undefined,
      reviewNote: index?.review_note ?? undefined,
    };
  });
}

export async function listCurrentUserIndexPages(
  supabase: SupabaseClient,
  userIndex: { id: string; indexId: string },
  page: number,
  pageSize: number,
) {
  const start = (page - 1) * pageSize;
  const { data: pageData, count, error } = await supabase
    .from("index_pages")
    .select("id,index_id,site_id,url,title,order,content_height,updated_at,user_page_progress!left(user_index_id,url,viewed_height,progress_percent,raw_progress_version,raw_progress,updated_at)", { count: "exact" })
    .eq("index_id", userIndex.indexId)
    .eq("user_page_progress.user_index_id", userIndex.id)
    .order("order", { ascending: true })
    .range(start, start + pageSize - 1);

  if (error) throw new Error("Could not load current user index pages.");

  const pages = (pageData ?? []) as DbIndexPageWithProgress[];
  if (pages.length === 0) {
    return { pages: [], totalCount: count ?? 0 };
  }

  return {
    pages: pages.map(({ user_page_progress: progressRows, ...item }) => mapPageWithProgress(item, progressRows?.[0], userIndex.id)),
    totalCount: count ?? 0,
  };
}

export async function listCurrentSystemIndexes(
  supabase: SupabaseClient,
  filters: { host?: string } = {},
) {
  let query = supabase
    .from("indexes")
    .select("id,site_id,host,scope_key,scope_title,schema_version,version,page_count,indexed_at,updated_at,system_status")
    .eq("source", "system")
    .order("updated_at", { ascending: false });

  const host = filters.host?.trim();
  if (host) {
    query = query.ilike("host", `%${host}%`);
  }

  const { data: indexData, error } = await query;
  if (error) throw new Error("Could not load system indexes.");

  const indexes = (indexData ?? []) as DbIndex[];

  return indexes.map((index) => ({
    id: index.id ?? "",
    siteId: index.site_id ?? "",
    host: index.host ?? "",
    scopeKey: index.scope_key ?? "",
    scopeTitle: index.scope_title ?? "",
    schemaVersion: index.schema_version ?? 0,
    version: index.version ?? "",
    pageCount: index.page_count ?? 0,
    indexedAt: index.indexed_at ?? "",
    updatedAt: index.updated_at ?? "",
    systemStatus: index.system_status ?? "inactive",
  }));
}

export async function listCurrentSystemIndexPages(
  supabase: SupabaseClient,
  indexId: string,
  page: number,
  pageSize: number,
) {
  const start = (page - 1) * pageSize;
  const { data, count, error } = await supabase
    .from("index_pages")
    .select("id,url,title,order,content_height,updated_at", { count: "exact" })
    .eq("index_id", indexId)
    .order("order", { ascending: true })
    .range(start, start + pageSize - 1);

  if (error) throw new Error("Could not load system index pages.");

  return {
    pages: ((data ?? []) as DbIndexPage[]).map((item) => ({
      id: item.id,
      url: item.url,
      title: item.title,
      order: item.order ?? 0,
      contentHeight: item.content_height ?? undefined,
      updatedAt: item.updated_at ?? "",
    })),
    totalCount: count ?? 0,
  };
}

export async function upsertSystemIndex(supabase: SupabaseClient, snapshot: SystemIndexSnapshot) {
  const indexedAt = new Date().toISOString();
  const normalized = normalizeIndexSnapshot({
    site: snapshot.site,
    pages: snapshot.pages,
  });
  const indexRow = await insertIndex(supabase, {
    source: "system",
    owner_user_id: null,
    site_id: normalized.site.siteId,
    host: normalized.site.host,
    scope_key: normalized.site.scopeKey,
    scope_title: normalized.site.scopeTitle,
    schema_version: snapshot.schemaVersion,
    version: hashJson(snapshot),
    content_hash: hashJson(snapshot),
    page_count: normalized.pages.length,
    index_snapshot: snapshot,
    indexed_at: indexedAt,
    review_status: "approved",
    system_status: "inactive",
    approved_from_index_id: null,
  });

  await upsertIndexPages(supabase, indexRow.id, normalized.pages);

  return indexRow;
}

async function upsertIndex(
  supabase: SupabaseClient,
  row: Record<string, unknown>,
  onConflict: string,
): Promise<DbIndex> {
  const { data, error } = await supabase
    .from("indexes")
    .upsert(row, { onConflict })
    .select("id,version")
    .single();

  if (error || !data) {
    throw new Error("Could not save index.");
  }

  return data as DbIndex;
}

async function insertIndex(
  supabase: SupabaseClient,
  row: Record<string, unknown>,
): Promise<DbIndex> {
  const { data, error } = await supabase
    .from("indexes")
    .insert(row)
    .select("id,version")
    .single();

  if (error || !data) {
    throw new Error("Could not save index.");
  }

  return data as DbIndex;
}

async function upsertIndexPages(supabase: SupabaseClient, indexId: string, pages: PortablePage[]) {
  const rows = pages.map((page) => ({
    index_id: indexId,
    site_id: page.siteId,
    url: page.url,
    title: page.title,
    order: page.order,
    content_height: page.contentHeight ?? null,
    content_hash: page.contentHash ?? null,
    structure_hash: page.structureHash ?? null,
    indexed_at: new Date().toISOString(),
  }));

  if (rows.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("index_pages")
    .upsert(rows, { onConflict: "index_id,url" })
    .select("id,url");

  if (error) {
    throw new Error("Could not save index pages.");
  }

  return (data ?? []) as Array<{ id: string; url: string }>;
}

async function upsertUserIndex(
  supabase: SupabaseClient,
  row: {
    user_id: string;
    index_id: string;
    relation_source: UserIndexRelationSource;
    synced_index_version: string | null;
  },
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("user_indexes")
    .upsert(row, { onConflict: "user_id,index_id" })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Could not save user index.");
  }

  return data as { id: string };
}

async function upsertProgressRows(
  supabase: SupabaseClient,
  userId: string,
  userIndexId: string,
  pages: PortablePage[],
  progress: PortableProgress[],
  pageRows: Array<{ id: string; url: string }>,
) {
  const pagesByUrl = new Map(pages.map((page) => [page.url, page]));
  const pageIdsByUrl = new Map(pageRows.map((page) => [page.url, page.id]));
  const progressByUrl = new Map(progress.map((item) => [item.url, item]));
  const rows = pages.map((page) => {
    const raw = progressByUrl.get(page.url);
    const normalizedProgress = raw
      ? normalizeRawProgress(raw, page.contentHeight)
      : { rawProgressVersion: null, rawProgress: null, viewedHeight: 0, progressPercent: 0 };

    return {
      user_id: userId,
      user_index_id: userIndexId,
      index_page_id: pageIdsByUrl.get(page.url) ?? null,
      site_id: page.siteId,
      url: page.url,
      title: page.title,
      order: page.order,
      content_height: pagesByUrl.get(page.url)?.contentHeight ?? null,
      viewed_height: Math.round(normalizedProgress.viewedHeight),
      progress_percent: normalizedProgress.progressPercent,
      raw_progress_version: normalizedProgress.rawProgressVersion,
      raw_progress: normalizedProgress.rawProgress,
    };
  });

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("user_page_progress")
    .upsert(rows, { onConflict: "user_id,user_index_id,url" });

  if (error) {
    console.error("Could not save user page progress", {
      supabase: {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      },
      batch: {
        rowCount: rows.length,
        progressCount: rows.filter((row) => row.raw_progress !== null).length,
        viewedRangeCount: rows.reduce(
          (count, row) => count + (row.raw_progress?.viewedRanges.length ?? 0),
          0,
        ),
        negativeViewedHeightCount: rows.filter((row) => row.viewed_height < 0).length,
        nonIntegerViewedHeightCount: rows.filter((row) => !Number.isInteger(row.viewed_height)).length,
        maxViewedHeight: rows.reduce(
          (maxViewedHeight, row) => Math.max(maxViewedHeight, row.viewed_height),
          0,
        ),
      },
    });
    throw new Error("Could not save user page progress.");
  }
}

function assemblePortableSiteBundle(userIndex: DbUserIndex, progressRows: DbProgress[]): PortableSiteBundle {
  const index = userIndex.indexes;
  const normalized = normalizeIndexSnapshot(index?.index_snapshot);
  const progress = progressRows.map((row) => {
    if (row.raw_progress) {
      return normalizeRawProgress(row.raw_progress, row.content_height ?? undefined).rawProgress;
    }

    return {
      siteId: row.site_id,
      url: row.url,
      viewedRanges: [],
      viewedHeight: row.viewed_height,
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    };
  });

  return {
    site: normalized.site,
    pages: normalized.pages,
    siteSettings: isPortableBundle(index?.index_snapshot) ? index.index_snapshot.siteSettings : undefined,
    progress,
  };
}

function isPortableBundle(input: unknown): input is PortableSiteBundle {
  return typeof input === "object" && input !== null && "siteSettings" in input;
}

function groupBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const value = String(row[key]);
    groups.set(value, [...(groups.get(value) ?? []), row]);
  }

  return groups;
}

function latestDate(values: Array<string | undefined>) {
  return values.reduce<Date | null>((latest, value) => {
    if (!value) return latest;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return latest;

    return !latest || date > latest ? date : latest;
  }, null);
}

function hashJson(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

async function findAvailableIndex(
  supabase: SupabaseClient,
  filters: { source: IndexSource; siteId: string; ownerUserId?: string; reviewStatus?: IndexReviewStatus },
) {
  let query = supabase
    .from("indexes")
    .select("site_id,host,scope_key,scope_title,page_count,updated_at")
    .eq("source", filters.source)
    .eq("site_id", filters.siteId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (filters.ownerUserId) {
    query = query.eq("owner_user_id", filters.ownerUserId);
  }

  if (filters.reviewStatus) {
    query = query.eq("review_status", filters.reviewStatus);
  }

  if (filters.source === "system") {
    query = query.eq("system_status", "active");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Could not check index availability.");
  }

  return ((data ?? []) as DbIndex[])[0] ?? null;
}

function availableIndexResponse(
  availableIndexes: AvailableIndex[],
): IndexAvailabilityResponse {
  const firstIndex = availableIndexes[0];

  if (!firstIndex) {
    return { available: false };
  }

  return {
    available: true,
    site: availableIndexSite(firstIndex.index),
    kinds: availableIndexes.map((availableIndex) => availableIndex.kind),
  };
}

function isAvailableIndex(availableIndex: AvailableIndex | null): availableIndex is AvailableIndex {
  return availableIndex !== null;
}

function availableIndexSite(index: DbIndex) {
  return {
    siteId: index.site_id ?? "",
    host: index.host ?? "",
    scopeKey: index.scope_key ?? "",
    scopeTitle: index.scope_title ?? "",
    pageCount: index.page_count ?? 0,
    updatedAt: index.updated_at ?? "",
  };
}

function mapPageWithProgress(page: DbIndexPage, progress: DbProgressWithId | undefined, userIndexId: string) {
  return {
    id: page.id,
    userIndexId,
    indexPageId: page.id,
    siteId: page.site_id,
    url: page.url,
    title: page.title,
    order: page.order ?? undefined,
    contentHeight: page.content_height ?? undefined,
    viewedHeight: progress?.viewed_height ?? 0,
    progressPercent: progress?.progress_percent ?? 0,
    rawProgressVersion: progress?.raw_progress_version ?? undefined,
    rawProgress: progress?.raw_progress,
    updatedAt: progress?.updated_at ?? page.updated_at ?? "",
  };
}
