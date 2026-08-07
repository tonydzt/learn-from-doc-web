import type { Metadata } from "next";

import { AdminTesterFeedback } from "@/app/admin/testers/AdminTesterFeedback";
import { addSystemIndexTester, removeSystemIndexTester } from "@/app/admin/testers/actions";
import { product } from "@/content/site";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { listSystemIndexTesters } from "@/lib/system-index-testers";

export const metadata: Metadata = {
  title: `System index testers | ${product.name}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminTestersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminTestersPage({ searchParams }: AdminTestersPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const error = firstParam(params.error);
  const status = firstParam(params.status);
  const testers = await listSystemIndexTesters(createAdminSupabaseClient());

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Access management</p>
        <h1>System index testers</h1>
      </div>

      <div className="admin-stack">
        <AdminTesterFeedback error={error} status={status} />

        <form className="admin-panel" action={addSystemIndexTester}>
          <h2>Add test account</h2>
          <p>The account must already exist in Supabase Auth.</p>
          <label htmlFor="tester-email">Account email</label>
          <input id="tester-email" name="email" type="email" required />
          <button className="button button--primary" type="submit">
            Add tester
          </button>
        </form>

        <section className="admin-panel">
          <h2>Test accounts</h2>
          {testers.length ? (
            <div className="admin-table" role="table" aria-label="System index tester accounts">
              <div className="admin-table-row admin-table-head" role="row">
                <span role="columnheader">Email</span>
                <span role="columnheader">Account ID</span>
                <span role="columnheader">Granted</span>
                <span role="columnheader">Access</span>
                <span role="columnheader">Action</span>
              </div>
              {testers.map((tester) => (
                <div className="admin-table-row" role="row" key={tester.userId}>
                  <strong role="cell">{tester.email}</strong>
                  <small role="cell">{tester.userId}</small>
                  <span role="cell">{formatDate(tester.grantedAt)}</span>
                  <span role="cell">Permanent</span>
                  <form role="cell" action={removeSystemIndexTester}>
                    <input type="hidden" name="userId" value={tester.userId} />
                    <button className="button button--secondary" type="submit" aria-label={`Remove ${tester.email}`}>
                      Remove
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p>No system index tester accounts.</p>
          )}
        </section>
      </div>
    </>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
