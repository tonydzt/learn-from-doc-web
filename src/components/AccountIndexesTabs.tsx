"use client";

import { useMemo, useState } from "react";

type AccountIndexProgress = {
  id: string;
  userIndexId: string;
  siteId: string;
  url: string;
  title?: string;
  viewedHeight: number;
  progressPercent: number;
  rawProgress?: unknown;
  updatedAt: string;
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
  viewedPageCount: number;
  totalViewedHeight: number;
  totalContentHeight: number;
  updatedAt: string;
  reviewStatus?: string;
  submittedAt?: string;
  reviewNote?: string;
  progress: AccountIndexProgress[];
};

type AccountIndexesTabsProps = {
  indexes: AccountIndexItem[];
  actions: {
    clearIndexProgress: (formData: FormData) => void | Promise<void>;
    clearPageProgress: (formData: FormData) => void | Promise<void>;
    deleteUploadedIndex: (formData: FormData) => void | Promise<void>;
    submitForReview: (formData: FormData) => void | Promise<void>;
    unlinkIndex: (formData: FormData) => void | Promise<void>;
  };
};

export function AccountIndexesTabs({ actions, indexes }: AccountIndexesTabsProps) {
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
        <section className="settings-index-host-group" aria-labelledby={`host-${hostSlug(group.host)}`} key={group.host}>
          <div className="settings-index-host-header">
            <h4 id={`host-${hostSlug(group.host)}`}>{group.host}</h4>
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
                          aria-controls={`index-panel-${index.id}`}
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
                      <td>
                        {index.viewedPageCount}/{index.pageCount}
                      </td>
                      <td>
                        {relationSourceLabel(index.relationSource)} · {reviewStatusLabel(index.reviewStatus)} ·{" "}
                        {index.viewedPageCount}/{index.pageCount} pages
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <article
        aria-label="Selected index detail"
        className="settings-index-detail"
        id={`index-panel-${activeIndex.id}`}
      >
        <div className="settings-index-detail-header">
          <div>
            <h4>{activeIndex.scopeTitle}</h4>
            <p>{activeIndex.host}</p>
            <span className="settings-index-source">{relationSourceLabel(activeIndex.relationSource)}</span>
            {activeIndex.indexSource === "user_upload" ? (
              <span className="settings-index-source">{reviewStatusLabel(activeIndex.reviewStatus)}</span>
            ) : null}
            {activeIndex.reviewNote ? <p>{activeIndex.reviewNote}</p> : null}
          </div>
          <div className="settings-index-actions">
            {activeIndex.indexSource === "user_upload" && canSubmitForReview(activeIndex.reviewStatus) ? (
              <form action={actions.submitForReview}>
                <input type="hidden" name="indexId" value={activeIndex.indexId} />
                <button className="button button--primary" type="submit">
                  Submit for review
                </button>
              </form>
            ) : null}
            <details className="settings-index-actions-menu">
              <summary className="button button--secondary">
                More actions <span aria-hidden="true">⌄</span>
              </summary>
              <div className="settings-index-actions-popover">
                <form action={actions.clearIndexProgress}>
                  <input type="hidden" name="userIndexId" value={activeIndex.id} />
                  <button className="settings-index-menu-item" type="submit">
                    Clear index progress
                  </button>
                </form>
                {activeIndex.indexSource === "user_upload" ? (
                  <form action={actions.deleteUploadedIndex}>
                    <input type="hidden" name="indexId" value={activeIndex.indexId} />
                    <button className="settings-index-menu-item settings-index-menu-item--danger" type="submit">
                      Delete uploaded index
                    </button>
                  </form>
                ) : (
                  <form action={actions.unlinkIndex}>
                    <input type="hidden" name="userIndexId" value={activeIndex.id} />
                    <button className="settings-index-menu-item settings-index-menu-item--danger" type="submit">
                      Remove from my account
                    </button>
                  </form>
                )}
              </div>
            </details>
          </div>
        </div>

        {activeIndex.progress.length ? (
          <div className="settings-progress-list">
            {activeIndex.progress.map((progress) => (
              <details key={progress.id} className="settings-progress-item">
                <summary>
                  <strong>{progress.title || progress.url}</strong>
                  <span>{progress.progressPercent}%</span>
                </summary>
                <p>{progress.url}</p>
                <form action={actions.clearPageProgress}>
                  <input type="hidden" name="userIndexId" value={activeIndex.id} />
                  <input type="hidden" name="url" value={progress.url} />
                  <button className="button button--secondary" type="submit">
                    Clear page progress
                  </button>
                </form>
                <pre>{JSON.stringify(progress.rawProgress ?? {}, null, 2)}</pre>
              </details>
            ))}
          </div>
        ) : (
          <div className="settings-empty-state">
            <strong>No page progress</strong>
            <p>This index has no saved reading progress yet.</p>
          </div>
        )}
      </article>
    </div>
  );
}

function groupIndexesByHost(indexes: AccountIndexItem[]) {
  const groups = new Map<string, AccountIndexItem[]>();

  indexes.forEach((index) => {
    const host = index.host || "Unknown host";
    groups.set(host, [...(groups.get(host) ?? []), index]);
  });

  return Array.from(groups, ([host, groupIndexes]) => ({ host, indexes: groupIndexes }));
}

function hostSlug(host: string): string {
  return host.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function relationSourceLabel(source: string): string {
  return source === "synced_system" ? "Synced system" : "Uploaded";
}

function reviewStatusLabel(status?: string): string {
  if (status === "pending") return "Pending review";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Not submitted";
}

function canSubmitForReview(status?: string): boolean {
  return !status || status === "none" || status === "rejected";
}
