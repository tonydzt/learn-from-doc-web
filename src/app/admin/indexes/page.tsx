import type { Metadata } from "next";
import Link from "next/link";

import {
  approvePendingIndexReview,
  approvePendingSiteReview,
  deleteSystemIndex,
  markSystemIndexActiveAction,
  rejectPendingIndexReview,
  rebuildSystemIndexPages,
} from "@/app/admin/indexes/actions";
import { product } from "@/content/site";
import {
  getAdminIndexRawSnapshot,
  listAdminIndexPages,
  listPendingReviewIndexes,
  listSystemAdminIndexes,
} from "@/lib/indexes";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: `System indexes | ${product.name}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminIndexesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminIndexesPage({ searchParams }: AdminIndexesPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const selectedIndexId = firstParam(params.index);
  const supabase = createAdminSupabaseClient();
  const [systemIndexes, pendingIndexes] = await Promise.all([
    listSystemAdminIndexes(supabase),
    listPendingReviewIndexes(supabase),
  ]);
  const indexes = [
    ...systemIndexes.map((index) => ({ ...index, kind: "system" as const })),
    ...pendingIndexes.map((index) => ({ ...index, kind: "pending" as const })),
  ];
  const selectedIndex = indexes.find((index) => index.id === selectedIndexId) ?? indexes[0];
  const [pages, rawSnapshot] = selectedIndex
    ? await Promise.all([
      listAdminIndexPages(supabase, selectedIndex.id),
      getAdminIndexRawSnapshot(supabase, selectedIndex.id),
    ])
    : [[], null];

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">System operations</p>
        <h1>System indexes</h1>
      </div>

      {selectedIndex ? (
        <section className="admin-panel admin-indexes-workbench">
          <div className="indexes-workbench">
            <aside aria-label="Index directory" className="indexes-directory">
              <div className="indexes-directory-header">
                <span>Directory</span>
                <strong>{indexes.length} scopes</strong>
              </div>
              <DirectorySection indexes={systemIndexes.map((index) => ({ ...index, kind: "system" as const }))} label="System indexes" selectedIndexId={selectedIndex.id} />
              {pendingIndexes.length > 0 ? <DirectorySection approveSiteAction={approvePendingSiteReview} indexes={pendingIndexes.map((index) => ({ ...index, kind: "pending" as const }))} label="Pending review" selectedIndexId={selectedIndex.id} /> : null}
            </aside>

            <article aria-label="Selected index" className="indexes-pages-panel admin-index-manager">
              <div className="indexes-pages-header">
                <div>
                  <p className="indexes-eyebrow">{selectedIndex.host} <span>/</span> {selectedIndex.siteId}</p>
                  <h2>{selectedIndex.scopeTitle}</h2>
                  <div className="indexes-statuses">
                    <span>{selectedIndex.kind === "pending" ? "Pending review" : "System index"}</span>
                    {selectedIndex.kind === "system" ? <span>{selectedIndex.systemStatus === "active" ? "Active" : "Inactive"}</span> : null}
                  </div>
                  {selectedIndex.kind === "system" ? <p className="admin-index-helper">Active is the version currently provided to users. Inactive versions are kept for review or later activation.</p> : <p className="admin-index-helper">Review this uploaded scope, then approve it as a new system-index version or reject it.</p>}
                </div>
                {selectedIndex.kind === "system" ? <div className="settings-index-actions">
                  <form action={markSystemIndexActiveAction}><input type="hidden" name="indexId" value={selectedIndex.id} /><button className="button button--primary" type="submit">Mark active</button></form>
                  <details className="settings-index-actions-menu"><summary className="button button--secondary">More actions <span aria-hidden="true">⌄</span></summary><div className="settings-index-actions-popover">
                    <form action={rebuildSystemIndexPages}><input type="hidden" name="indexId" value={selectedIndex.id} /><button className="settings-index-menu-item" type="submit">Rebuild page records from snapshot</button></form>
                    <form action={deleteSystemIndex}><input type="hidden" name="indexId" value={selectedIndex.id} /><button className="settings-index-menu-item settings-index-menu-item--danger" type="submit">Delete system index</button></form>
                  </div></details>
                </div> : null}
              </div>

              {selectedIndex.kind === "pending" ? <section className="admin-review-actions" aria-label="Review actions">
                <form action={approvePendingIndexReview}>
                  <input type="hidden" name="indexId" value={selectedIndex.id} />
                  <label htmlFor="approve-review-note">Review note <span>(optional)</span></label>
                  <textarea id="approve-review-note" name="reviewNote" rows={3} />
                  <button className="button button--primary" type="submit">Approve as system index</button>
                </form>
                <form action={rejectPendingIndexReview}>
                  <input type="hidden" name="indexId" value={selectedIndex.id} />
                  <label htmlFor="reject-review-note">Rejection note <span>(optional)</span></label>
                  <textarea id="reject-review-note" name="reviewNote" rows={3} />
                  <button className="button button--secondary" type="submit">Reject submission</button>
                </form>
              </section> : null}

              <dl className="admin-index-summary" aria-label="Selected index summary">
                <div><dt>Pages</dt><dd>{selectedIndex.pageCount}</dd></div>
                <div><dt>Version</dt><dd>{selectedIndex.version}</dd></div>
                <div><dt>{selectedIndex.kind === "pending" ? "Submitted" : "Updated"}</dt><dd>{formatDate(selectedIndex.kind === "pending" ? selectedIndex.submittedAt : selectedIndex.updatedAt)}</dd></div>
                <div><dt>Scope key</dt><dd>{selectedIndex.scopeKey}</dd></div>
              </dl>

              <section className="admin-index-content" aria-labelledby="admin-index-pages-title">
                <h3 id="admin-index-pages-title">Pages</h3>
                <div className="admin-table" role="table" aria-label="Index pages">
                  <div className="admin-table-row admin-table-head" role="row"><span role="columnheader">Title</span><span role="columnheader">Order</span><span role="columnheader">Height</span><span role="columnheader">Updated</span></div>
                  {pages.map((page) => <div className="admin-table-row" role="row" key={page.id}>
                    <strong role="cell">{String(page.title)}<small>{String(page.url)}</small></strong>
                    <span role="cell">{String(page.order)}</span><span role="cell">{String(page.content_height ?? "")}</span><span role="cell">{formatDate(page.updated_at)}</span>
                  </div>)}
                </div>
              </section>

              <details className="admin-raw-snapshot"><summary>Raw snapshot</summary><pre>{JSON.stringify(rawSnapshot, null, 2)}</pre></details>
            </article>
          </div>
        </section>
      ) : (
        <section className="admin-panel"><h2>No indexes</h2><p>System indexes and submitted scopes will appear here.</p></section>
      )}
    </>
  );
}

type DirectoryIndex = {
  id: string;
  host?: string;
  scopeTitle?: string;
  pageCount: number;
  kind: "system" | "pending";
};

function DirectorySection({ approveSiteAction, indexes, label, selectedIndexId }: { approveSiteAction?: (formData: FormData) => void | Promise<void>; indexes: DirectoryIndex[]; label: string; selectedIndexId: string }) {
  return (
    <section className="admin-directory-section" aria-label={label}>
      <div className="indexes-directory-header admin-directory-section-header"><span>{label}</span><strong>{indexes.length}</strong></div>
      <div className="indexes-directory-tree">
        {groupIndexesByHost(indexes).map((site) => (
          <details className="indexes-site-group" key={site.host} open>
            <summary className={approveSiteAction ? "indexes-site-label has-submit" : "indexes-site-label"}><span aria-hidden="true">⌄</span><strong>{site.host}</strong><small>{site.indexes.length}</small></summary>
            {approveSiteAction ? <form action={approveSiteAction} className="indexes-site-submit-form">
              <input type="hidden" name="host" value={site.host} />
              <button aria-label={`Approve all ${site.indexes.length} pending scopes from ${site.host}`} className="indexes-site-submit" type="submit">Approve {site.indexes.length}</button>
            </form> : null}
            <div className="indexes-scope-list">
              {site.indexes.map((index) => (
                <Link aria-current={index.id === selectedIndexId ? "page" : undefined} className={index.id === selectedIndexId ? "indexes-scope-link is-active" : "indexes-scope-link"} href={adminIndexHref(index.id)} key={index.id}>
                  <span>{index.scopeTitle}</span><small>{index.pageCount}</small>
                </Link>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function adminIndexHref(indexId: string): string {
  return `/admin/indexes?${new URLSearchParams({ index: indexId }).toString()}`;
}

function groupIndexesByHost<T extends { host?: string }>(indexes: T[]) {
  const groups = new Map<string, T[]>();
  indexes.forEach((index) => {
    const host = index.host || "Unknown host";
    groups.set(host, [...(groups.get(host) ?? []), index]);
  });
  return Array.from(groups, ([host, groupIndexes]) => ({ host, indexes: groupIndexes }));
}

function formatDate(value: unknown): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(value)));
}
