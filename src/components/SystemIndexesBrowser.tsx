import Link from "next/link";

type SystemIndexPage = {
  id: string;
  url: string;
  title: string;
  order: number;
  contentHeight?: number;
  updatedAt: string;
};

type SystemIndexItem = {
  id: string;
  siteId: string;
  host: string;
  scopeKey: string;
  scopeTitle: string;
  schemaVersion: number;
  version: string;
  pageCount: number;
  indexedAt: string;
  updatedAt: string;
  systemStatus: string;
};

type SystemIndexesBrowserProps = {
  host: string;
  indexes: SystemIndexItem[];
  page: number;
  pages?: { pages: SystemIndexPage[]; totalCount: number };
  selectedIndexId: string;
  selectedSite: string;
};

const pageSize = 20;

export function SystemIndexesBrowser({ host, indexes, page, pages, selectedIndexId, selectedSite }: SystemIndexesBrowserProps) {
  const sites = groupIndexesByHost(indexes);
  const activeIndex = indexes.find((index) => index.host === selectedSite && index.id === selectedIndexId) ?? indexes[0];
  if (!activeIndex) return null;
  const totalPages = activeIndex ? Math.max(1, Math.ceil((pages?.totalCount ?? 0) / pageSize)) : 1;

  return (
    <div className="indexes-workbench">
      <aside aria-label="System index directory" className="indexes-directory">
        <div className="indexes-directory-header">
          <span>Directory</span>
          <strong>{indexes.length} scopes</strong>
        </div>
        <div className="indexes-directory-tree">
          {sites.map((site) => (
            <details className="indexes-site-group" key={site.host} open>
              <summary className="indexes-site-label"><span aria-hidden="true">⌄</span><strong>{site.host}</strong><small>{site.indexes.length}</small></summary>
              <div className="indexes-scope-list">
                {site.indexes.map((index) => {
                  const selected = index.id === activeIndex?.id;
                  return <Link aria-current={selected ? "page" : undefined} className={selected ? "indexes-scope-link is-active" : "indexes-scope-link"} href={systemIndexHref({ host, site: site.host, index: index.id })} key={index.id}>
                    <span>{index.scopeTitle}</span><small>{index.pageCount}</small>
                  </Link>;
                })}
              </div>
            </details>
          ))}
        </div>
      </aside>

      {activeIndex ? <article aria-label="Selected system index detail" className="indexes-pages-panel">
        <div className="indexes-pages-header">
          <div>
            <p className="indexes-eyebrow">{activeIndex.host} <span>/</span> {activeIndex.siteId}</p>
            <h4>{activeIndex.scopeTitle}</h4>
            <div className="indexes-statuses"><span>System index</span><span>{statusLabel(activeIndex.systemStatus)}</span></div>
          </div>
        </div>

        {pages?.pages.length ? <><div className="indexes-page-list" role="table" aria-label="System index pages">
          <div className="indexes-page-head indexes-page-head--system" role="row"><span role="columnheader">Page</span><span role="columnheader">Order</span></div>
          {pages.pages.map((item) => <div className="indexes-page-row indexes-page-row--system" role="row" key={item.id}>
            <span className="indexes-page-title" role="cell"><strong>{item.title || item.url}</strong><small>{item.title ? item.url : ""}</small></span>
            <span className="indexes-page-progress" role="cell">{item.order + 1}</span>
          </div>)}
        </div><nav aria-label="System page navigation" className="settings-pagination">
          {page > 1 ? <Link href={systemIndexHref({ host, site: activeIndex.host, index: activeIndex.id, page: page - 1 })}>Previous</Link> : <span>Previous</span>}
          <span>Page {page} of {totalPages} · {pageSize} per page</span>
          {page < totalPages ? <Link href={systemIndexHref({ host, site: activeIndex.host, index: activeIndex.id, page: page + 1 })}>Next</Link> : <span>Next</span>}
        </nav></> : <div className="indexes-empty-panel"><strong>No pages in this scope</strong><p>This system index has no structured pages yet.</p></div>}
      </article> : <section className="indexes-empty-panel indexes-empty-panel--select"><span aria-hidden="true">↖</span><strong>Select a scope</strong><p>Choose a scope from the directory to view its pages.</p></section>}
    </div>
  );
}

function systemIndexHref(params: { host: string; site?: string; index?: string; page?: number }) {
  const searchParams = new URLSearchParams({ view: "system" });
  if (params.host) searchParams.set("host", params.host);
  if (params.site) searchParams.set("site", params.site);
  if (params.index) searchParams.set("index", params.index);
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  return `/account/indexes?${searchParams.toString()}`;
}

function groupIndexesByHost(indexes: SystemIndexItem[]) {
  const groups = new Map<string, SystemIndexItem[]>();
  indexes.forEach((index) => {
    const host = index.host || "Unknown host";
    groups.set(host, [...(groups.get(host) ?? []), index]);
  });
  return Array.from(groups, ([host, groupIndexes]) => ({ host, indexes: groupIndexes }));
}

function statusLabel(status: string): string {
  return status === "active" ? "Active" : "Inactive";
}
