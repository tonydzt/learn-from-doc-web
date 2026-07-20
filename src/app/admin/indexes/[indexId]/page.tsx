import Link from "next/link";
import type { Metadata } from "next";

import {
  approvePendingIndexReview,
  deleteSystemIndex,
  markSystemIndexActiveAction,
  rebuildSystemIndexPages,
  rejectPendingIndexReview,
} from "@/app/admin/indexes/actions";
import { product } from "@/content/site";
import {
  getAdminIndexRawSnapshot,
  getAdminIndexDetail,
  listAdminIndexPages,
} from "@/lib/indexes";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: `System index detail | ${product.name}`,
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type AdminIndexDetailPageProps = {
  params: Promise<{ indexId: string }>;
};

export default async function AdminIndexDetailPage({ params }: AdminIndexDetailPageProps) {
  const { indexId } = await params;
  const supabase = createAdminSupabaseClient();
  const [index, pages, rawSnapshot] = await Promise.all([
    getAdminIndexDetail(supabase, indexId),
    listAdminIndexPages(supabase, indexId),
    getAdminIndexRawSnapshot(supabase, indexId),
  ]);
  const source = String(index.source ?? "");
  const reviewStatus = String(index.review_status ?? "none");
  const systemStatus = String(index.system_status ?? "inactive");

  return (
    <>
      <div className="admin-heading admin-heading-with-action">
        <div>
          <p className="eyebrow">{source === "system" ? "System index" : "Uploaded index review"}</p>
          <h1>{String(index.scope_title ?? "System index")}</h1>
        </div>
        <Link className="button button--secondary" href="/admin/indexes">
          Back to indexes
        </Link>
      </div>

      <div className="admin-stack">
        <section className="admin-panel admin-detail-grid" aria-label="Index details">
          <p>
            <strong>Source</strong>
            <span>{source}</span>
          </p>
          <p>
            <strong>Review status</strong>
            <span>{reviewStatus}</span>
          </p>
          <p>
            <strong>System status</strong>
            <span>{source === "system" ? systemStatus : "n/a"}</span>
          </p>
          <p>
            <strong>Site ID</strong>
            <span>{String(index.site_id ?? "")}</span>
          </p>
          <p>
            <strong>Host</strong>
            <span>{String(index.host ?? "")}</span>
          </p>
          <p>
            <strong>Scope key</strong>
            <span>{String(index.scope_key ?? "")}</span>
          </p>
          <p>
            <strong>Version</strong>
            <span>{String(index.version ?? "")}</span>
          </p>
          <p>
            <strong>Pages</strong>
            <span>{String(index.page_count ?? 0)}</span>
          </p>
          <p>
            <strong>Updated</strong>
            <span>{formatDate(index.updated_at)}</span>
          </p>
        </section>

        {source === "system" ? (
          <section className="admin-panel admin-actions-row" aria-label="System index actions">
            <form action={markSystemIndexActiveAction}>
              <input type="hidden" name="indexId" value={indexId} />
              <button className="button button--primary" type="submit">
                Mark active
              </button>
            </form>
            <form action={rebuildSystemIndexPages}>
              <input type="hidden" name="indexId" value={indexId} />
              <button className="button button--secondary" type="submit">
                Rebuild pages from snapshot
              </button>
            </form>
            <form action={deleteSystemIndex}>
              <input type="hidden" name="indexId" value={indexId} />
              <button className="button button--danger" type="submit">
                Delete system index
              </button>
            </form>
          </section>
        ) : null}

        {source === "user_upload" && reviewStatus === "pending" ? (
          <section className="admin-panel admin-actions-row" aria-label="Review actions">
            <form action={approvePendingIndexReview}>
              <input type="hidden" name="indexId" value={indexId} />
              <label htmlFor="approve-note">Review note</label>
              <textarea id="approve-note" name="reviewNote" rows={3} />
              <button className="button button--primary" type="submit">
                Approve as system version
              </button>
            </form>
            <form action={rejectPendingIndexReview}>
              <input type="hidden" name="indexId" value={indexId} />
              <label htmlFor="reject-note">Reject note</label>
              <textarea id="reject-note" name="reviewNote" rows={3} />
              <button className="button button--danger" type="submit">
                Reject
              </button>
            </form>
          </section>
        ) : null}

        <section className="admin-panel">
          <h2>Pages</h2>
          <div className="admin-table" role="table" aria-label="Index pages">
            <div className="admin-table-row admin-table-head" role="row">
              <span role="columnheader">Title</span>
              <span role="columnheader">Order</span>
              <span role="columnheader">Height</span>
              <span role="columnheader">Updated</span>
            </div>
            {pages.map((page) => (
              <div className="admin-table-row" role="row" key={page.id}>
                <strong role="cell">
                  {String(page.title)}
                  <small>{String(page.url)}</small>
                </strong>
                <span role="cell">{String(page.order)}</span>
                <span role="cell">{String(page.content_height ?? "")}</span>
                <span role="cell">{formatDate(page.updated_at)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <h2>Raw snapshot</h2>
          <pre className="admin-json">{JSON.stringify(rawSnapshot, null, 2)}</pre>
        </section>
      </div>
    </>
  );
}

function formatDate(value: unknown): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(String(value)),
  );
}
