import Link from "next/link";
import type { Metadata } from "next";

import { product } from "@/content/site";
import { listPendingReviewIndexes, listSystemAdminIndexes } from "@/lib/indexes";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: `System indexes | ${product.name}`,
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type AdminIndexesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminIndexesPage({ searchParams }: AdminIndexesPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const filters = {
    siteId: firstParam(params.siteId),
    host: firstParam(params.host),
  };
  const supabase = createAdminSupabaseClient();
  const [indexes, pendingReviews] = await Promise.all([
    listSystemAdminIndexes(supabase, filters),
    listPendingReviewIndexes(supabase, filters),
  ]);

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">System operations</p>
        <h1>System indexes</h1>
      </div>

      <div className="admin-stack">
        <form className="admin-panel admin-filter" action="/admin/indexes">
          <label htmlFor="siteId">Site ID</label>
          <input id="siteId" name="siteId" defaultValue={filters.siteId} placeholder="react.dev::learn" />
          <label htmlFor="host">Host</label>
          <input id="host" name="host" defaultValue={filters.host} placeholder="react.dev" />
          <button className="button button--primary" type="submit">
            Filter
          </button>
        </form>

        <section className="admin-panel">
          <h2>Pending reviews</h2>
          {pendingReviews.length ? (
            <div className="admin-table" role="table" aria-label="Pending index reviews">
              <div className="admin-table-row admin-table-head" role="row">
                <span role="columnheader">Site</span>
                <span role="columnheader">Pages</span>
                <span role="columnheader">Submitted</span>
                <span role="columnheader">Action</span>
              </div>
              {pendingReviews.map((review) => (
                <div className="admin-table-row" role="row" key={review.id}>
                  <strong role="cell">
                    {review.scopeTitle}
                    <small>{review.siteId}</small>
                  </strong>
                  <span role="cell">{review.pageCount}</span>
                  <span role="cell">{formatDate(review.submittedAt)}</span>
                  <span role="cell">
                    <Link className="admin-text-link" href={`/admin/indexes/${review.id}`}>
                      Review {review.scopeTitle}
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No uploaded indexes are waiting for review.</p>
          )}
        </section>

        {indexes.length ? (
          <div className="admin-panel">
            <div className="admin-table" role="table" aria-label="System indexes">
              <div className="admin-table-row admin-table-head" role="row">
                <span role="columnheader">Site</span>
                <span role="columnheader">Pages</span>
                <span role="columnheader">Version</span>
                <span role="columnheader">Updated</span>
                <span role="columnheader">Action</span>
              </div>
              {indexes.map((index) => (
                <div className="admin-table-row" role="row" key={index.id}>
                  <strong role="cell">
                    {index.scopeTitle}
                    <small>{index.siteId}</small>
                  </strong>
                  <span role="cell">{index.pageCount}</span>
                  <span role="cell">{index.version}</span>
                  <span role="cell">{formatDate(index.updatedAt)}</span>
                  <span role="cell">
                    <Link className="admin-text-link" href={`/admin/indexes/${index.id}`}>
                      View {index.scopeTitle}
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <section className="admin-panel">
            <h2>No system indexes</h2>
            <p>System indexes that already exist in Supabase will appear here.</p>
          </section>
        )}
      </div>
    </>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: unknown): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(String(value)),
  );
}
