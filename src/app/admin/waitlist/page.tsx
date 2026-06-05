import type { Metadata } from "next";
import { cookies } from "next/headers";

import { WaitlistAdminPage } from "@/components/WaitlistAdminPage";
import { getWaitlistSummary } from "@/lib/waitlist";
import {
  verifyAdminSessionCookieValue,
  waitlistAdminCookieName,
} from "@/lib/waitlistAdminAuth";

export const metadata: Metadata = {
  title: "Waitlist admin | Developer Docs Progress Tracker",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminWaitlistPage() {
  const cookieStore = await cookies();
  const authenticated = verifyAdminSessionCookieValue(
    cookieStore.get(waitlistAdminCookieName)?.value,
  );
  const summary = authenticated ? await getWaitlistSummary() : undefined;

  return <WaitlistAdminPage authenticated={authenticated} summary={summary} />;
}
