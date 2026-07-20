import { fireEvent, render, screen, within } from "@testing-library/react";
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
  unlinkIndex: vi.fn(),
};

describe("AccountIndexesTabs", () => {
  it("shows a compact index list and switches one detail at a time", () => {
    render(<AccountIndexesTabs actions={actions} indexes={indexes} />);

    expect(screen.getByRole("heading", { name: "react.dev" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "playwright.dev" })).toBeInTheDocument();
    const reactTable = screen.getByRole("table", { name: /directory trees for react.dev/i });
    expect(reactTable).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /directory trees for playwright.dev/i })).toBeInTheDocument();
    expect(within(reactTable).getByRole("columnheader", { name: /directory tree/i })).toBeInTheDocument();
    expect(within(reactTable).getByRole("columnheader", { name: /host/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /react learn/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /react reference/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Uploaded")).toBeInTheDocument();
    expect(screen.getByText("Not submitted")).toBeInTheDocument();
    expect(screen.getByText("Quick Start")).toBeInTheDocument();
    expect(screen.queryByText("Installation Intro")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove from my account/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit for review/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete uploaded index/i })).toBeInTheDocument();
    const uploadedActions = screen.getByText("More actions").closest("details");
    expect(uploadedActions).not.toBeNull();
    expect(within(uploadedActions!).getByRole("button", { name: /clear index progress/i })).toBeInTheDocument();
    expect(within(uploadedActions!).getByRole("button", { name: /delete uploaded index/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /playwright docs/i }));

    expect(screen.getByRole("button", { name: /react learn/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /playwright docs/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Synced system")).toBeInTheDocument();
    expect(screen.queryByText("Quick Start")).not.toBeInTheDocument();
    expect(screen.getByText("Installation Intro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove from my account/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete uploaded index/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit for review/i })).not.toBeInTheDocument();
    const systemActions = screen.getByText("More actions").closest("details");
    expect(systemActions).not.toBeNull();
    expect(within(systemActions!).getByRole("button", { name: /clear index progress/i })).toBeInTheDocument();
    expect(within(systemActions!).getByRole("button", { name: /remove from my account/i })).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /your indexes/i })).not.toBeInTheDocument();
  });
});
