"use server";

import { revalidatePath } from "next/cache";

import { loginAdmin } from "@/app/admin/actions";
import { notifyWaitlistSubscribers } from "@/lib/waitlist";

export async function loginWaitlistAdmin(formData: FormData) {
  formData.set("returnPath", "/admin/waitlist");
  await loginAdmin(formData);
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
