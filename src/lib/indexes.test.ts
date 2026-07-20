import { describe, expect, it } from "vitest";

import {
  approveIndexReview,
  getIndexAvailability,
  getPendingReviewIndexAvailability,
  listCurrentSystemIndexes,
  listCurrentUserIndexes,
  listAdminIndexes,
  markSystemIndexActive,
  pullPendingReviewIndex,
  pullUserIndexes,
  submitUploadedIndexForReview,
  uploadUserIndexes,
  upsertSystemIndex,
} from "./indexes";

class TableQuery {
  private filters: Array<[string, unknown]> = [];
  private payload: unknown;
  private conflict?: string;
  private selectColumns?: string;

  constructor(
    private readonly db: FakeSupabase,
    private readonly table: string,
  ) {}

  select(columns = "*") {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  ilike(column: string, value: string) {
    this.db.calls.push({ table: this.table, method: "ilike", column, value });
    return this;
  }

  order(column: string, options?: unknown) {
    this.db.calls.push({ table: this.table, method: "order", column, options });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.db.calls.push({ table: this.table, method: "in", column, values });
    this.filters.push([column, values]);
    return this;
  }

  limit(count: number) {
    this.db.calls.push({ table: this.table, method: "limit", count });
    return this;
  }

  upsert(payload: unknown, options?: { onConflict?: string }) {
    this.payload = payload;
    this.conflict = options?.onConflict;
    this.db.calls.push({ table: this.table, method: "upsert", payload, options });
    return this;
  }

  insert(payload: unknown) {
    this.payload = payload;
    this.db.calls.push({ table: this.table, method: "insert", payload });
    return this;
  }

  update(payload: unknown) {
    this.payload = payload;
    this.db.calls.push({ table: this.table, method: "update", payload });
    return this;
  }

  delete() {
    this.db.calls.push({ table: this.table, method: "delete" });
    return this;
  }

  async single() {
    return this.db.resolve(this.table, {
      method: "single",
      filters: this.filters,
      payload: this.payload,
      conflict: this.conflict,
      selectColumns: this.selectColumns,
    });
  }

  then(resolve: (value: unknown) => void) {
    return Promise.resolve(
      this.db.resolve(this.table, {
        method: "then",
        filters: this.filters,
        payload: this.payload,
        selectColumns: this.selectColumns,
      }),
    ).then(resolve);
  }
}

class FakeSupabase {
  calls: Array<Record<string, unknown>> = [];
  private queues = new Map<string, unknown[]>();

  queue(table: string, responses: unknown[]) {
    this.queues.set(table, [...responses]);
  }

  from(table: string) {
    this.calls.push({ table, method: "from" });
    return new TableQuery(this, table);
  }

  resolve(table: string, query: Record<string, unknown>) {
    this.calls.push({ table, ...query });
    const queue = this.queues.get(table) ?? [];
    return queue.shift() ?? { data: [], error: null };
  }
}

const portablePayload = {
  schemaVersion: 1 as const,
  exportedAt: 1000,
  scope: "all" as const,
  includeProgress: true,
  sites: [
    {
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        createdAt: 1,
        updatedAt: 2,
      },
      pages: [
        {
          siteId: "react.dev::learn",
          url: "https://react.dev/learn",
          title: "Learn",
          order: 0,
          contentHeight: 1000,
        },
      ],
      siteSettings: { theme: "system" },
      progress: [
        {
          siteId: "react.dev::learn",
          url: "https://react.dev/learn",
          viewedRanges: [{ start: 0, end: 250 }],
          viewedHeight: 250,
          updatedAt: 3,
        },
      ],
    },
  ],
};

describe("index services", () => {
  it("uploads client indexes by upserting index, pages, user relation, and progress", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [{ data: { id: "index-1", version: "1000" }, error: null }]);
    db.queue("index_pages", [{ data: [{ id: "page-1", url: "https://react.dev/learn" }], error: null }]);
    db.queue("user_indexes", [{ data: { id: "user-index-1" }, error: null }]);
    db.queue("user_page_progress", [{ data: [], error: null }]);

    const result = await uploadUserIndexes(db as never, "user-1", {
      schemaVersion: 1,
      clientUpdatedAt: 1000,
      payload: portablePayload,
    });

    expect(result.siteCount).toBe(1);
    expect(db.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "indexes", method: "upsert" }),
        expect.objectContaining({ table: "index_pages", method: "upsert" }),
        expect.objectContaining({ table: "user_indexes", method: "upsert" }),
        expect.objectContaining({ table: "user_page_progress", method: "upsert" }),
      ]),
    );
    expect(db.calls.find((call) => call.table === "indexes" && call.method === "upsert")).toMatchObject({
      options: { onConflict: "source,owner_user_id,site_id" },
    });
  });

  it("pulls user indexes as importable portable data", async () => {
    const db = new FakeSupabase();
    db.queue("user_indexes", [
      {
        data: [
          {
            id: "user-index-1",
            index_id: "index-1",
            indexes: {
              id: "index-1",
              index_snapshot: portablePayload.sites[0],
              updated_at: "2026-01-01T00:00:00.000Z",
            },
          },
        ],
        error: null,
      },
    ]);
    db.queue("user_page_progress", [
      {
        data: [
          {
            user_index_id: "user-index-1",
            site_id: "react.dev::learn",
            url: "https://react.dev/learn",
            viewed_height: 250,
            raw_progress: portablePayload.sites[0].progress?.[0],
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        ],
        error: null,
      },
    ]);

    const result = await pullUserIndexes(db as never, "user-1");

    expect(result.payload?.schemaVersion).toBe(1);
    expect(result.payload?.includeProgress).toBe(true);
    expect(result.payload?.sites[0]?.progress?.[0]).toMatchObject({
      url: "https://react.dev/learn",
      viewedHeight: 250,
    });
  });

  it("returns null portable data when a user has no indexes", async () => {
    const db = new FakeSupabase();
    db.queue("user_indexes", [{ data: [], error: null }]);

    const result = await pullUserIndexes(db as never, "user-1");

    expect(result.payload).toBeNull();
  });

  it("lists current user indexes with zero progress from index pages when progress was cleared", async () => {
    const db = new FakeSupabase();
    db.queue("user_indexes", [
      {
        data: [
          {
            id: "user-index-1",
            index_id: "index-1",
            relation_source: "uploaded",
            updated_at: "2026-06-12T08:00:00.000Z",
            indexes: {
              id: "index-1",
              source: "user_upload",
              site_id: "react.dev::learn",
              host: "react.dev",
              scope_key: "learn",
              scope_title: "React Learn",
              page_count: 1,
            },
          },
        ],
        error: null,
      },
    ]);
    db.queue("user_page_progress", [{ data: [], error: null }]);
    db.queue("index_pages", [
      {
        data: [
          {
            id: "page-1",
            index_id: "index-1",
            site_id: "react.dev::learn",
            url: "https://react.dev/learn",
            title: "Quick Start",
            order: 0,
            content_height: 1000,
            updated_at: "2026-06-12T08:00:00.000Z",
          },
        ],
        error: null,
      },
    ]);

    const result = await listCurrentUserIndexes(db as never, "user-1");

    expect(result[0]).toMatchObject({
      scopeTitle: "React Learn",
      pageCount: 1,
      viewedPageCount: 0,
      totalContentHeight: 1000,
      totalViewedHeight: 0,
      progress: [
        {
          title: "Quick Start",
          viewedHeight: 0,
          progressPercent: 0,
        },
      ],
    });
  });

  it("lists searchable system indexes with their pages", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [
      {
        data: [
          {
            id: "system-index-1",
            source: "system",
            site_id: "react.dev::learn",
            host: "react.dev",
            scope_key: "learn",
            scope_title: "React Learn",
            schema_version: 1,
            version: "v1",
            page_count: 1,
            indexed_at: "2026-06-12T08:00:00.000Z",
            updated_at: "2026-06-12T08:00:00.000Z",
            system_status: "active",
          },
        ],
        error: null,
      },
    ]);
    db.queue("index_pages", [
      {
        data: [
          {
            id: "page-1",
            index_id: "system-index-1",
            url: "https://react.dev/learn",
            title: "Quick Start",
            order: 0,
            content_height: 1000,
            updated_at: "2026-06-12T08:00:00.000Z",
          },
        ],
        error: null,
      },
    ]);

    const result = await listCurrentSystemIndexes(db as never, { host: "react" });

    expect(result[0]).toMatchObject({
      id: "system-index-1",
      host: "react.dev",
      scopeTitle: "React Learn",
      systemStatus: "active",
      pages: [
        {
          title: "Quick Start",
          contentHeight: 1000,
        },
      ],
    });
    expect(db.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "indexes", method: "ilike", column: "host", value: "%react%" }),
        expect.objectContaining({ table: "index_pages", method: "in", column: "index_id", values: ["system-index-1"] }),
      ]),
    );
  });

  it("returns available site info from the system index", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [
      {
        data: [
          {
            site_id: "react.dev::learn",
            host: "react.dev",
            scope_key: "learn",
            scope_title: "React Learn",
            page_count: 42,
            updated_at: "2026-06-11T08:00:00.000Z",
          },
        ],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await getIndexAvailability(db as never, "user-1", "react.dev::learn");

    expect(result).toEqual({
      available: true,
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        pageCount: 42,
        updatedAt: "2026-06-11T08:00:00.000Z",
      },
      kinds: ["system"],
    });
  });

  it("returns both system and current user's uploaded availability when both exist", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [
      {
        data: [
          {
            site_id: "react.dev::learn",
            host: "react.dev",
            scope_key: "learn",
            scope_title: "React Learn",
            page_count: 42,
            updated_at: "2026-06-11T08:00:00.000Z",
          },
        ],
        error: null,
      },
      {
        data: [
          {
            site_id: "react.dev::learn",
            host: "react.dev",
            scope_key: "learn",
            scope_title: "My React Learn",
            page_count: 3,
            updated_at: "2026-06-11T09:00:00.000Z",
          },
        ],
        error: null,
      },
    ]);

    const result = await getIndexAvailability(db as never, "user-1", "react.dev::learn");

    expect(result).toMatchObject({
      available: true,
      site: {
        scopeTitle: "React Learn",
        pageCount: 42,
      },
      kinds: ["system", "user_upload"],
    });
    expect(db.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ filters: expect.arrayContaining([["owner_user_id", "user-1"]]) }),
      ]),
    );
  });

  it("returns unavailable when neither system nor current user upload exists", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [
      { data: [], error: null },
      { data: [], error: null },
    ]);

    await expect(getIndexAvailability(db as never, "user-1", "react.dev::learn")).resolves.toEqual({
      available: false,
    });
  });

  it("returns pending review index availability for a site", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [
      {
        data: [
          {
            site_id: "react.dev::learn",
            host: "react.dev",
            scope_key: "learn",
            scope_title: "Pending React Learn",
            page_count: 4,
            updated_at: "2026-06-12T08:00:00.000Z",
          },
        ],
        error: null,
      },
    ]);

    const result = await getPendingReviewIndexAvailability(db as never, "react.dev::learn");

    expect(result).toMatchObject({
      available: true,
      site: {
        scopeTitle: "Pending React Learn",
        pageCount: 4,
      },
      kinds: ["pending_review"],
    });
    expect(db.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filters: expect.arrayContaining([
            ["source", "user_upload"],
            ["review_status", "pending"],
            ["site_id", "react.dev::learn"],
          ]),
        }),
      ]),
    );
  });

  it("filters admin index list by source, site, host, and owner", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [{ data: [], error: null }]);

    await listAdminIndexes(db as never, {
      source: "user_upload",
      siteId: "react.dev::learn",
      host: "react.dev",
      ownerUserId: "user-1",
    });

    expect(db.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "indexes", method: "then" }),
      ]),
    );
  });

  it("creates a system index version and its structured pages", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [{ data: { id: "system-index-1", version: "1" }, error: null }]);
    db.queue("index_pages", [{ data: [], error: null }]);

    await upsertSystemIndex(db as never, {
      schemaVersion: 1,
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
      },
      pages: portablePayload.sites[0].pages,
    });

    expect(db.calls.find((call) => call.table === "indexes" && call.method === "insert")).toMatchObject({
      payload: expect.objectContaining({ source: "system", system_status: "inactive" }),
    });
    expect(db.calls).toEqual(expect.arrayContaining([expect.objectContaining({ table: "index_pages", method: "upsert" })]));
  });

  it("submits an uploaded index for review", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [{ data: null, error: null }]);

    await submitUploadedIndexForReview(db as never, "user-1", "index-1");

    expect(db.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "indexes",
          method: "update",
          payload: expect.objectContaining({ review_status: "pending" }),
        }),
        expect.objectContaining({ filters: expect.arrayContaining([["owner_user_id", "user-1"]]) }),
      ]),
    );
  });

  it("approves a pending uploaded index by creating an inactive system version", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [
      {
        data: {
          id: "uploaded-index-1",
          source: "user_upload",
          site_id: "react.dev::learn",
          host: "react.dev",
          scope_key: "learn",
          scope_title: "React Learn",
          schema_version: 1,
          version: "v1",
          page_count: 1,
          index_snapshot: portablePayload.sites[0],
        },
        error: null,
      },
      { data: { id: "system-index-1", version: "v1" }, error: null },
      { data: null, error: null },
    ]);
    db.queue("index_pages", [
      {
        data: [
          {
            id: "page-1",
            index_id: "uploaded-index-1",
            site_id: "react.dev::learn",
            url: "https://react.dev/learn",
            title: "Learn",
            order: 0,
            content_height: 1000,
          },
        ],
        error: null,
      },
      { data: [{ id: "system-page-1", url: "https://react.dev/learn" }], error: null },
    ]);

    await approveIndexReview(db as never, null, "uploaded-index-1", "looks good");

    expect(db.calls.find((call) => call.table === "indexes" && call.method === "insert")).toMatchObject({
      payload: expect.objectContaining({
        source: "system",
        system_status: "inactive",
        approved_from_index_id: "uploaded-index-1",
      }),
    });
    expect(db.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "indexes",
          method: "update",
          payload: expect.objectContaining({ review_status: "approved", review_note: "looks good" }),
        }),
      ]),
    );
  });

  it("marks one system version active by deactivating the site's other versions first", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [
      { data: { id: "system-index-1", source: "system", site_id: "react.dev::learn" }, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);

    await markSystemIndexActive(db as never, "system-index-1");

    const updates = db.calls.filter((call) => call.table === "indexes" && call.method === "update");
    expect(updates[0]).toMatchObject({ payload: { system_status: "inactive" } });
    expect(updates[1]).toMatchObject({ payload: { system_status: "active" } });
  });

  it("pulls a pending review index as portable data without progress", async () => {
    const db = new FakeSupabase();
    db.queue("indexes", [
      {
        data: [
          {
            id: "uploaded-index-1",
            source: "user_upload",
            index_snapshot: portablePayload.sites[0],
            updated_at: "2026-06-12T08:00:00.000Z",
          },
        ],
        error: null,
      },
    ]);

    const result = await pullPendingReviewIndex(db as never, "react.dev::learn");

    expect(result.payload?.scope).toBe("site");
    expect(result.payload?.includeProgress).toBe(false);
    expect(result.payload?.sites[0]?.site.siteId).toBe("react.dev::learn");
    expect(result.payload?.sites[0]?.progress).toEqual([]);
  });
});
