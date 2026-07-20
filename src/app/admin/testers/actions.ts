"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  grantSystemIndexTester,
  revokeSystemIndexTester,
} from "@/lib/system-index-testers";
import {
  verifyAdminSessionCookieValue,
  waitlistAdminCookieName,
} from "@/lib/waitlistAdminAuth";

export async function addSystemIndexTester(formData: FormData) {
  if (!(await hasAdminSession())) {
    redirect("/admin/testers?error=Unauthorized");
    return;
  }

  const email = String(formData.get("email") ?? "");
  let result: Awaited<ReturnType<typeof grantSystemIndexTester>>;

  try {
    result = await grantSystemIndexTester(createAdminSupabaseClient(), email);
  } catch {
    redirect("/admin/testers?error=Could%20not%20add%20tester");
    return;
  }

  if (!result.ok) {
    redirect(`/admin/testers?error=${encodeURIComponent(result.message)}`);
    return;
  }

  revalidatePath("/admin/testers");
  redirect("/admin/testers?status=added");
}

export async function removeSystemIndexTester(formData: FormData) {
  if (!(await hasAdminSession())) {
    redirect("/admin/testers?error=Unauthorized");
    return;
  }

  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    redirect("/admin/testers?error=Account%20ID%20is%20required");
    return;
  }

  try {
    await revokeSystemIndexTester(createAdminSupabaseClient(), userId);
  } catch {
    redirect("/admin/testers?error=Could%20not%20remove%20tester");
    return;
  }

  revalidatePath("/admin/testers");
  redirect("/admin/testers?status=removed");
}

async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionCookieValue(
    cookieStore.get(waitlistAdminCookieName)?.value,
  );
}
