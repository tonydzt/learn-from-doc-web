"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  approveIndexReview,
  approvePendingSiteReviews,
  deleteAdminIndex,
  getAdminIndexRawSnapshot,
  markSystemIndexActive,
  rebuildAdminIndexPages,
  rejectIndexReview,
} from "@/lib/indexes";
import { normalizeIndexSnapshot } from "@/lib/index-normalizer";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function deleteSystemIndex(formData: FormData) {
  const indexId = String(formData.get("indexId") ?? "");

  if (!indexId) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  await deleteAdminIndex(supabase, indexId);
  revalidatePath("/admin/indexes");
  redirect("/admin/indexes");
}

export async function rebuildSystemIndexPages(formData: FormData) {
  const indexId = String(formData.get("indexId") ?? "");

  if (!indexId) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const snapshot = await getAdminIndexRawSnapshot(supabase, indexId);
  const normalized = normalizeIndexSnapshot(snapshot);

  await rebuildAdminIndexPages(supabase, indexId, normalized.pages);
  revalidatePath("/admin/indexes");
}

export async function approvePendingIndexReview(formData: FormData) {
  const indexId = String(formData.get("indexId") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  if (!indexId) return;
  await approveIndexReview(createAdminSupabaseClient(), null, indexId, note);
  revalidatePath("/admin/indexes");
}

export async function approvePendingSiteReview(formData: FormData) {
  const host = String(formData.get("host") ?? "").trim();
  if (!host) return;
  await approvePendingSiteReviews(createAdminSupabaseClient(), null, host);
  revalidatePath("/admin/indexes");
}

export async function rejectPendingIndexReview(formData: FormData) {
  const indexId = String(formData.get("indexId") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  if (!indexId) return;
  await rejectIndexReview(createAdminSupabaseClient(), null, indexId, note);
  revalidatePath("/admin/indexes");
}

export async function markSystemIndexActiveAction(formData: FormData) {
  const indexId = String(formData.get("indexId") ?? "");

  if (!indexId) {
    return;
  }

  await markSystemIndexActive(createAdminSupabaseClient(), indexId);
  revalidatePath("/admin/indexes");
}
