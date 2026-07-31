import Link from "next/link";

type AccountIndexPage = {
  id: string;
  userIndexId: string;
  url: string;
  title?: string;
  order?: number;
  contentHeight?: number;
  viewedHeight: number;
  progressPercent: number;
};

type AccountIndexItem = {
  id: string;
  indexId: string;
  relationSource: string;
  indexSource: string;
  siteId: string;
  host: string;
  scopeTitle: string;
  pageCount: number;
  reviewStatus?: string;
  reviewNote?: string;
};

type AccountIndexesTabsProps = {
  indexes: AccountIndexItem[];
  selectedSite: string;
  selectedIndexId: string;
  page: number;
  pages?: { pages: AccountIndexPage[]; totalCount: number };
  actions: {
    clearIndexProgress: (formData: FormData) => void | Promise<void>;
    clearPageProgress: (formData: FormData) => void | Promise<void>;
    deleteUploadedIndex: (formData: FormData) => void | Promise<void>;
    submitForReview: (formData: FormData) => void | Promise<void>;
    submitSiteForReview: (formData: FormData) => void | Promise<void>;
    unlinkIndex: (formData: FormData) => void | Promise<void>;
  };
};

const pageSize = 20;

export function AccountIndexesTabs({ actions, indexes, page, pages, selectedIndexId, selectedSite }: AccountIndexesTabsProps) {
  const sites = groupIndexesByHost(indexes);
  const activeIndex = indexes.find((index) => index.host === selectedSite && index.id === selectedIndexId) ?? indexes[0];

  if (!activeIndex) return null;

  const totalPages = activeIndex ? Math.max(1, Math.ceil((pages?.totalCount ?? 0) / pageSize)) : 1;

  return (
    <div className="indexes-workbench">
      <aside aria-label="Index directory" className="indexes-directory">
        <div className="indexes-directory-header">
          <span>Directory</span>
          <strong>{indexes.length} scopes</strong>
        </div>
        <div className="indexes-directory-tree">
          {sites.map((site) => {
            const reviewableScopeCount = site.indexes.filter((index) => index.indexSource === "user_upload" && canSubmitForReview(index.reviewStatus)).length;

            return <details className="indexes-site-group" key={site.host} open>
              <summary className={reviewableScopeCount > 0 ? "indexes-site-label has-submit" : "indexes-site-label"}><span aria-hidden="true">⌄</span><strong>{site.host}</strong><small>{site.indexes.length}</small></summary>
              {reviewableScopeCount > 0 ? <form action={actions.submitSiteForReview} className="indexes-site-submit-form">
                <input type="hidden" name="host" value={site.host} />
                <button aria-label={`Submit ${reviewableScopeCount} scopes from ${site.host} for review`} className="indexes-site-submit" type="submit">Submit {reviewableScopeCount}</button>
              </form> : null}
              <div className="indexes-scope-list">
                {site.indexes.map((index) => {
                  const selected = index.id === activeIndex?.id;
                  return <Link aria-current={selected ? "page" : undefined} className={selected ? "indexes-scope-link is-active" : "indexes-scope-link"} href={indexHref({ site: site.host, index: index.id })} key={index.id}>
                    <span>{index.scopeTitle}</span><small>{index.pageCount}</small>
                  </Link>;
                })}
              </div>
            </details>;
          })}
        </div>
      </aside>

      {activeIndex ? <article aria-label="Selected index detail" className="indexes-pages-panel">
        <div className="indexes-pages-header">
          <div>
            <p className="indexes-eyebrow">{activeIndex.host} <span>/</span> {activeIndex.siteId}</p>
            <h4>{activeIndex.scopeTitle}</h4>
            <div className="indexes-statuses"><span>{relationSourceLabel(activeIndex.relationSource)}</span>{activeIndex.indexSource === "user_upload" ? <span>{reviewStatusLabel(activeIndex.reviewStatus)}</span> : null}</div>
            {activeIndex.reviewNote ? <p className="indexes-review-note">{activeIndex.reviewNote}</p> : null}
          </div>
          <div className="settings-index-actions">
            {activeIndex.indexSource === "user_upload" && canSubmitForReview(activeIndex.reviewStatus) ? <form action={actions.submitForReview}><input type="hidden" name="indexId" value={activeIndex.indexId} /><button className="button button--primary" type="submit">Submit for review</button></form> : null}
            <details className="settings-index-actions-menu"><summary className="button button--secondary">More actions <span aria-hidden="true">⌄</span></summary><div className="settings-index-actions-popover">
              <form action={actions.clearIndexProgress}><input type="hidden" name="userIndexId" value={activeIndex.id} /><button className="settings-index-menu-item" type="submit">Clear index progress</button></form>
              {activeIndex.indexSource === "user_upload" ? <form action={actions.deleteUploadedIndex}><input type="hidden" name="indexId" value={activeIndex.indexId} /><button className="settings-index-menu-item settings-index-menu-item--danger" type="submit">Delete uploaded index</button></form> : <form action={actions.unlinkIndex}><input type="hidden" name="userIndexId" value={activeIndex.id} /><button className="settings-index-menu-item settings-index-menu-item--danger" type="submit">Remove from my account</button></form>}
            </div></details>
          </div>
        </div>

        {pages?.pages.length ? <><div className="indexes-page-list" role="table" aria-label="Index pages">
          <div className="indexes-page-head" role="row"><span role="columnheader">Page</span><span role="columnheader">Progress</span><span aria-hidden="true" /></div>
          {pages.pages.map((item) => <div className="indexes-page-row" role="row" key={item.id}>
            <span className="indexes-page-title" role="cell"><strong>{item.title || item.url}</strong><small>{item.title ? item.url : ""}</small></span>
            <span className="indexes-page-progress" role="cell">{item.progressPercent}%</span>
            <form role="cell" action={actions.clearPageProgress}><input type="hidden" name="userIndexId" value={activeIndex.id} /><input type="hidden" name="url" value={item.url} /><button className="button button--secondary" type="submit">Clear</button></form>
          </div>)}
        </div><nav aria-label="Page navigation" className="settings-pagination">
          {page > 1 ? <Link href={indexHref({ site: activeIndex.host, index: activeIndex.id, page: page - 1 })}>Previous</Link> : <span>Previous</span>}
          <span>Page {page} of {totalPages} · {pageSize} per page</span>
          {page < totalPages ? <Link href={indexHref({ site: activeIndex.host, index: activeIndex.id, page: page + 1 })}>Next</Link> : <span>Next</span>}
        </nav></> : <div className="indexes-empty-panel"><strong>No pages in this scope</strong><p>This scope has no structured pages yet.</p></div>}
      </article> : <section className="indexes-empty-panel indexes-empty-panel--select"><span aria-hidden="true">↖</span><strong>Select a scope</strong><p>Choose a scope from the directory to view its pages and reading progress.</p></section>}
    </div>
  );
}

function indexHref(params: { site?: string; index?: string; page?: number }) {
  const searchParams = new URLSearchParams();
  if (params.site) searchParams.set("site", params.site);
  if (params.index) searchParams.set("index", params.index);
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  const query = searchParams.toString();
  return query ? `/account/indexes?${query}` : "/account/indexes";
}

function groupIndexesByHost(indexes: AccountIndexItem[]) {
  const groups = new Map<string, AccountIndexItem[]>();
  indexes.forEach((index) => {
    const host = index.host || "Unknown host";
    groups.set(host, [...(groups.get(host) ?? []), index]);
  });
  return Array.from(groups, ([host, groupIndexes]) => ({ host, indexes: groupIndexes }));
}

function relationSourceLabel(source: string) { return source === "synced_system" ? "Synced system" : "Uploaded"; }
function reviewStatusLabel(status?: string) { if (status === "pending") return "Pending review"; if (status === "approved") return "Approved"; if (status === "rejected") return "Rejected"; return "Not submitted"; }
function canSubmitForReview(status?: string) { return !status || status === "none" || status === "rejected"; }
