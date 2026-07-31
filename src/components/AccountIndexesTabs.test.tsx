import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountIndexesTabs } from "./AccountIndexesTabs";

const indexes = [
  {
    id: "user-index-1",
    indexId: "index-1",
    relationSource: "uploaded",
    indexSource: "user_upload",
    siteId: "react.dev::learn",
    host: "react.dev",
    scopeTitle: "React Learn",
    pageCount: 2,
    viewedPageCount: 1,
    totalViewedHeight: 500,
    totalContentHeight: 1000,
    updatedAt: "2026-06-12T08:00:00.000Z",
    reviewStatus: "none",
    progress: [
      {
        id: "progress-1",
        userIndexId: "user-index-1",
        siteId: "react.dev::learn",
        url: "https://react.dev/learn",
        title: "Quick Start",
        viewedHeight: 500,
        progressPercent: 50,
        rawProgress: { viewedHeight: 500 },
        updatedAt: "2026-06-12T08:00:00.000Z",
      },
    ],
  },
  {
    id: "user-index-2",
    indexId: "index-2",
    relationSource: "synced_system",
    indexSource: "system",
    siteId: "playwright.dev::docs",
    host: "playwright.dev",
    scopeTitle: "Playwright Docs",
    pageCount: 3,
    viewedPageCount: 1,
    totalViewedHeight: 800,
    totalContentHeight: 2000,
    updatedAt: "2026-06-12T08:00:00.000Z",
    reviewStatus: "approved",
    progress: [
      {
        id: "progress-2",
        userIndexId: "user-index-2",
        siteId: "playwright.dev::docs",
        url: "https://playwright.dev/docs/intro",
        title: "Installation Intro",
        viewedHeight: 800,
        progressPercent: 40,
        rawProgress: { viewedHeight: 800 },
        updatedAt: "2026-06-12T08:00:00.000Z",
      },
    ],
  },
  {
    id: "user-index-3",
    indexId: "index-3",
    relationSource: "uploaded",
    indexSource: "user_upload",
    siteId: "react.dev::reference",
    host: "react.dev",
    scopeTitle: "React Reference",
    pageCount: 5,
    viewedPageCount: 0,
    totalViewedHeight: 0,
    totalContentHeight: 5000,
    updatedAt: "2026-06-12T08:00:00.000Z",
    reviewStatus: "none",
    progress: [
      {
        id: "progress-3",
        userIndexId: "user-index-3",
        siteId: "react.dev::reference",
        url: "https://react.dev/reference/react",
        title: "React APIs",
        viewedHeight: 0,
        progressPercent: 0,
        rawProgress: { viewedHeight: 0 },
        updatedAt: "2026-06-12T08:00:00.000Z",
      },
    ],
  },
];

const actions = {
  clearIndexProgress: vi.fn(),
  clearPageProgress: vi.fn(),
  deleteUploadedIndex: vi.fn(),
  submitForReview: vi.fn(),
  submitSiteForReview: vi.fn(),
  unlinkIndex: vi.fn(),
};

describe("AccountIndexesTabs", () => {
  it("keeps the two-level directory visible while showing selected scope pages", () => {
    const { rerender } = render(<AccountIndexesTabs actions={actions} indexes={indexes} page={1} selectedIndexId="" selectedSite="" pages={{ pages: [indexes[0].progress[0]], totalCount: 2 }} />);

    expect(screen.getByRole("complementary", { name: /index directory/i })).toBeInTheDocument();
    expect(screen.getByText("react.dev")).toBeInTheDocument();
    expect(screen.getByText("playwright.dev")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /react learn.*2/i })).toHaveAttribute("href", "/account/indexes?site=react.dev&index=user-index-1");
    expect(screen.getByRole("link", { name: /react reference.*5/i })).toHaveAttribute("href", "/account/indexes?site=react.dev&index=user-index-3");
    expect(screen.getByRole("link", { name: /react learn.*2/i, current: "page" })).toBeInTheDocument();
    expect(screen.getByText("Quick Start")).toBeInTheDocument();

    const reactSite = screen.getByText("react.dev").closest("details");
    expect(reactSite).toHaveAttribute("open");
    fireEvent.click(screen.getByText("react.dev"));
    expect(reactSite).not.toHaveAttribute("open");

    rerender(<AccountIndexesTabs actions={actions} indexes={indexes} page={2} selectedIndexId="user-index-1" selectedSite="react.dev" pages={{ pages: [indexes[0].progress[0]], totalCount: 42 }} />);

    expect(screen.getByRole("table", { name: /index pages/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /react learn.*2/i, current: "page" })).toBeInTheDocument();
    expect(screen.getByText("Quick Start")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3 · 20 per page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/account/indexes?site=react.dev&index=user-index-1");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/account/indexes?site=react.dev&index=user-index-1&page=3");
    expect(screen.getByRole("button", { name: /clear index progress/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete uploaded index/i })).toBeInTheDocument();
  });

  it("offers one site-level shortcut for all reviewable uploaded scopes", () => {
    render(<AccountIndexesTabs actions={actions} indexes={indexes} page={1} selectedIndexId="" selectedSite="" pages={{ pages: [indexes[0].progress[0]], totalCount: 2 }} />);

    const submitSiteButton = screen.getByRole("button", { name: /submit 2 scopes from react.dev for review/i });
    expect(submitSiteButton).toHaveTextContent("Submit 2");
    expect(submitSiteButton.closest("form")).toContainElement(screen.getByDisplayValue("react.dev"));
    expect(screen.queryByRole("button", { name: /playwright.dev for review/i })).not.toBeInTheDocument();
  });
});
