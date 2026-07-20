"use client";

import { useMemo, useState } from "react";

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
  pages: SystemIndexPage[];
};

type SystemIndexesBrowserProps = {
  indexes: SystemIndexItem[];
};

export function SystemIndexesBrowser({ indexes }: SystemIndexesBrowserProps) {
  const [activeIndexId, setActiveIndexId] = useState(indexes[0]?.id ?? "");
  const activeIndex = useMemo(
    () => indexes.find((index) => index.id === activeIndexId) ?? indexes[0],
    [activeIndexId, indexes],
  );

  if (!activeIndex) {
    return null;
  }

  const hostGroups = groupIndexesByHost(indexes);

  return (
    <div className="settings-index-list">
      {hostGroups.map((group) => (
        <section className="settings-index-host-group" aria-labelledby={`system-host-${hostSlug(group.host)}`} key={group.host}>
          <div className="settings-index-host-header">
            <h4 id={`system-host-${hostSlug(group.host)}`}>{group.host}</h4>
            <span>{group.indexes.length} directory trees</span>
          </div>
          <div className="settings-index-table-wrap">
            <table className="settings-index-table" aria-label={`Directory trees for ${group.host}`}>
              <thead>
                <tr>
                  <th scope="col">Directory tree</th>
                  <th scope="col">Host</th>
                  <th scope="col">Pages</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {group.indexes.map((index) => {
                  const selected = index.id === activeIndex.id;

                  return (
                    <tr className={selected ? "active" : undefined} key={index.id}>
                      <td>
                        <button
                          aria-controls={`system-index-panel-${index.id}`}
                          aria-pressed={selected}
                          className="settings-index-row-button"
                          onClick={() => setActiveIndexId(index.id)}
                          type="button"
                        >
                          <strong>{index.scopeTitle}</strong>
                          <small>{index.siteId}</small>
                        </button>
                      </td>
                      <td>{index.host}</td>
                      <td>{index.pageCount}</td>
                      <td>{statusLabel(index.systemStatus)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <article
        aria-label="Selected system index detail"
        className="settings-index-detail"
        id={`system-index-panel-${activeIndex.id}`}
      >
        <div className="settings-index-detail-header">
          <div>
            <h4>{activeIndex.scopeTitle}</h4>
            <p>{activeIndex.siteId}</p>
            <span className="settings-index-source">{statusLabel(activeIndex.systemStatus)}</span>
          </div>
        </div>

        <dl className="settings-index-meta" aria-label="System index metadata">
          <div>
            <dt>Host</dt>
            <dd>{activeIndex.host}</dd>
          </div>
          <div>
            <dt>Scope key</dt>
            <dd>{activeIndex.scopeKey}</dd>
          </div>
          <div>
            <dt>Schema</dt>
            <dd>{activeIndex.schemaVersion}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{activeIndex.version}</dd>
          </div>
          <div>
            <dt>Indexed</dt>
            <dd>{formatDate(activeIndex.indexedAt)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatDate(activeIndex.updatedAt)}</dd>
          </div>
        </dl>

        {activeIndex.pages.length ? (
          <div className="settings-progress-list" role="table" aria-label="System index pages">
            {activeIndex.pages.map((page) => (
              <div className="settings-progress-item settings-system-page" role="row" key={page.id}>
                <strong role="cell">{page.title}</strong>
                <span role="cell">{page.order}</span>
                <span role="cell">{page.contentHeight ?? "Unknown height"}</span>
                <p role="cell">{page.url}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="settings-empty-state settings-empty-state--inline">
            <strong>No pages</strong>
            <p>This system index has no structured pages yet.</p>
          </div>
        )}
      </article>
    </div>
  );
}

function groupIndexesByHost(indexes: SystemIndexItem[]) {
  const groups = new Map<string, SystemIndexItem[]>();

  indexes.forEach((index) => {
    const host = index.host || "Unknown host";
    groups.set(host, [...(groups.get(host) ?? []), index]);
  });

  return Array.from(groups, ([host, groupIndexes]) => ({ host, indexes: groupIndexes }));
}

function hostSlug(host: string): string {
  return host.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function statusLabel(status: string): string {
  return status === "active" ? "Active system index" : "Inactive system index";
}

function formatDate(value: string): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
