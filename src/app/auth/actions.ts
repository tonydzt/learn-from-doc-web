"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { regenerateUserAvatar, updateUserNickname } from "@/lib/profiles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveNickname(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  await updateUserNickname(supabase, user.id, String(formData.get("nickname") ?? ""));
  revalidatePath("/account");
}

export async function regenerateAvatar() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  await regenerateUserAvatar(supabase, user);
  revalidatePath("/account");
}

export async function deleteAccount() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

  if (error) {
    throw new Error("Could not delete account.");
  }

  await supabase.auth.signOut();
  redirect("/login?message=account-deleted");
}
