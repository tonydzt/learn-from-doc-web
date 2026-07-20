import type { Metadata } from "next";

import { WaitlistAdminPage } from "@/components/WaitlistAdminPage";
import { getWaitlistSummary } from "@/lib/waitlist";

export const metadata: Metadata = {
  title: "Waitlist admin | Developer Docs Progress Tracker",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminWaitlistPage() {
  const summary = await getWaitlistSummary();

  return <WaitlistAdminPage summary={summary} />;
}
