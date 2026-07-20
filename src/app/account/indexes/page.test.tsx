import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountIndexesPage from "./page";

const { redirectMock, getUserMock, getOrCreateUserProfileMock, listCurrentUserIndexesMock, listCurrentSystemIndexesMock } =
  vi.hoisted(() => ({
    redirectMock: vi.fn(),
    getUserMock: vi.fn(),
    getOrCreateUserProfileMock: vi.fn(),
    listCurrentUserIndexesMock: vi.fn(),
    listCurrentSystemIndexesMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));
vi.mock("@/lib/profiles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/profiles")>()),
  getOrCreateUserProfile: getOrCreateUserProfileMock,
}));
vi.mock("@/lib/indexes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/indexes")>()),
  listCurrentUserIndexes: listCurrentUserIndexesMock,
  listCurrentSystemIndexes: listCurrentSystemIndexesMock,
}));

describe("AccountIndexesPage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getUserMock.mockReset();
    getOrCreateUserProfileMock.mockReset();
    listCurrentUserIndexesMock.mockReset();
    listCurrentUserIndexesMock.mockResolvedValue([]);
    listCurrentSystemIndexesMock.mockReset();
    listCurrentSystemIndexesMock.mockResolvedValue([]);
  });

  it("redirects anonymous visitors to login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await AccountIndexesPage();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("shows an empty state when the user has no indexes", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1", email: "reader@example.com" } } });
    getOrCreateUserProfileMock.mockResolvedValue({
      nickname: "Reader01",
      avatarInitial: "R",
      avatarBackground: "#174E63",
      avatarColor: "#F9C846",
    });
    listCurrentUserIndexesMock.mockResolvedValue([]);

    render(await AccountIndexesPage());

    expect(screen.getByRole("link", { name: "Indexes", current: "page" })).toHaveAttribute(
      "href",
      "/account/indexes",
    );
    expect(screen.queryByText("Sync a system index")).not.toBeInTheDocument();
    expect(screen.getByText("No synced indexes")).toBeInTheDocument();
  });

  it("shows index summaries and page progress for the current user", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1", email: "reader@example.com" } } });
    getOrCreateUserProfileMock.mockResolvedValue({
      nickname: "Reader01",
      avatarInitial: "R",
      avatarBackground: "#174E63",
      avatarColor: "#F9C846",
    });
    listCurrentUserIndexesMock.mockResolvedValue([
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
    ]);

    render(await AccountIndexesPage());

    expect(screen.queryByText("Sync a system index")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "react.dev" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /directory trees for react.dev/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /react learn/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/uploaded · not submitted · 1\/2 pages/i)).toBeInTheDocument();
    expect(screen.getByText("Quick Start")).toBeInTheDocument();
    expect(screen.getByText(/viewedHeight/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear index progress/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete uploaded index/i })).toBeInTheDocument();
  });

  it("shows searchable system indexes on a separate view", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1", email: "reader@example.com" } } });
    getOrCreateUserProfileMock.mockResolvedValue({
      nickname: "Reader01",
      avatarInitial: "R",
      avatarBackground: "#174E63",
      avatarColor: "#F9C846",
    });
    listCurrentSystemIndexesMock.mockResolvedValue([
      {
        id: "system-index-1",
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        schemaVersion: 1,
        version: "v1",
        pageCount: 1,
        indexedAt: "2026-06-12T08:00:00.000Z",
        updatedAt: "2026-06-12T08:00:00.000Z",
        systemStatus: "active",
        pages: [
          {
            id: "page-1",
            url: "https://react.dev/learn",
            title: "Quick Start",
            order: 0,
            contentHeight: 1000,
            updatedAt: "2026-06-12T08:00:00.000Z",
          },
        ],
      },
    ]);

    render(
      await AccountIndexesPage({
        searchParams: Promise.resolve({ view: "system", host: "react.dev" }),
      }),
    );

    expect(screen.getByRole("link", { name: "System indexes", current: "page" })).toHaveAttribute(
      "href",
      "/account/indexes?view=system",
    );
    expect(screen.getByRole("textbox", { name: /search system indexes by host/i })).toHaveValue("react.dev");
    expect(screen.getByRole("heading", { name: "react.dev" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /directory trees for react.dev/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /react learn/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(screen.getByRole("article", { name: /selected system index detail/i })).getByText("Active system index")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /system index pages/i })).toBeInTheDocument();
    expect(screen.getByText("Quick Start")).toBeInTheDocument();
    expect(listCurrentSystemIndexesMock).toHaveBeenCalledWith(expect.anything(), { host: "react.dev" });
  });
});
