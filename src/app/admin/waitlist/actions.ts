"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  createAdminSessionCookieValue,
  verifyAdminPassword,
  waitlistAdminCookieName,
} from "@/lib/waitlistAdminAuth";
import { notifyWaitlistSubscribers } from "@/lib/waitlist";

export async function loginWaitlistAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(waitlistAdminCookieName, createAdminSessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin/waitlist",
    maxAge: 60 * 60 * 12,
  });
  revalidatePath("/admin/waitlist");
}

export async function sendWaitlistNotification(formData: FormData) {
  const subject = String(formData.get("subject") ?? "");
  const body = String(formData.get("body") ?? "");
  const result = await notifyWaitlistSubscribers({ subject, body });

  revalidatePath("/admin/waitlist");
  console.info(
    `Sent ${result.sent} of ${result.total} waitlist notification emails. ${result.failed} failed.`,
  );
}
