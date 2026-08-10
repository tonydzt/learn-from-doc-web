import type { Metadata } from "next";

import { product } from "@/content/site";

export const metadata: Metadata = {
  title: `Admin | ${product.name}`,
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  return (
    <section className="admin-console-workspace" aria-labelledby="admin-workspace-title">
      <p className="eyebrow">Operations directory</p>
      <h2 id="admin-workspace-title">Choose a section from the left.</h2>
      <p>
        Use the admin directory to review site requests, manage the waitlist, and
        maintain system documentation indexes.
      </p>
    </section>
  );
}
