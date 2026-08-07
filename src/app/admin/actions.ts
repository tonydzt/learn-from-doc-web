"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  createAdminSessionCookieValue,
  verifyAdminPassword,
  waitlistAdminCookieName,
} from "@/lib/waitlistAdminAuth";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/admin");

  if (!verifyAdminPassword(password)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(waitlistAdminCookieName, createAdminSessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });
  revalidatePath(returnPath.startsWith("/admin") ? returnPath : "/admin");
}
