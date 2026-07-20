"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearUserIndexProgress,
  clearUserPageProgress,
  deleteCurrentUserUploadedIndex,
  submitUploadedIndexForReview,
  unlinkCurrentUserIndex,
} from "@/lib/indexes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function unlinkCurrentUserIndexAction(formData: FormData) {
  const userIndexId = String(formData.get("userIndexId") ?? "");
  const { supabase, userId } = await requireCurrentUser();

  if (!userIndexId) {
    return;
  }

  await unlinkCurrentUserIndex(supabase, userId, userIndexId);
  revalidatePath("/account/indexes");
}

export async function deleteCurrentUserUploadedIndexAction(formData: FormData) {
  const indexId = String(formData.get("indexId") ?? "");
  const { supabase, userId } = await requireCurrentUser();

  if (!indexId) {
    return;
  }

  await deleteCurrentUserUploadedIndex(supabase, userId, indexId);
  revalidatePath("/account/indexes");
}

export async function submitCurrentUserIndexForReviewAction(formData: FormData) {
  const indexId = String(formData.get("indexId") ?? "");
  const { supabase, userId } = await requireCurrentUser();

  if (!indexId) {
    return;
  }

  await submitUploadedIndexForReview(supabase, userId, indexId);
  revalidatePath("/account/indexes");
}

export async function clearCurrentUserIndexProgressAction(formData: FormData) {
  const userIndexId = String(formData.get("userIndexId") ?? "");
  const { supabase, userId } = await requireCurrentUser();

  if (!userIndexId) {
    return;
  }

  await clearUserIndexProgress(supabase, userId, userIndexId);
  revalidatePath("/account/indexes");
}

export async function clearCurrentUserPageProgressAction(formData: FormData) {
  const userIndexId = String(formData.get("userIndexId") ?? "");
  const url = String(formData.get("url") ?? "");
  const { supabase, userId } = await requireCurrentUser();

  if (!userIndexId || !url) {
    return;
  }

  await clearUserPageProgress(supabase, userId, userIndexId, url);
  revalidatePath("/account/indexes");
}

async function requireCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login");
  }

  return { supabase, userId: user.id };
}
