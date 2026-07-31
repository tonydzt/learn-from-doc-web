import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountIndexesPage from "./page";

const { redirectMock, getClaimsMock, getOrCreateUserProfileMock, listCurrentUserIndexesMock, listCurrentUserIndexPagesMock, listCurrentSystemIndexesMock, listCurrentSystemIndexPagesMock } =
  vi.hoisted(() => ({
    redirectMock: vi.fn(),
    getClaimsMock: vi.fn(),
    getOrCreateUserProfileMock: vi.fn(),
    listCurrentUserIndexesMock: vi.fn(),
    listCurrentUserIndexPagesMock: vi.fn(),
    listCurrentSystemIndexesMock: vi.fn(),
    listCurrentSystemIndexPagesMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({
    auth: { getClaims: getClaimsMock },
  }),
}));
vi.mock("@/lib/profiles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/profiles")>()),
  getOrCreateUserProfile: getOrCreateUserProfileMock,
}));
vi.mock("@/lib/indexes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/indexes")>()),
  listCurrentUserIndexes: listCurrentUserIndexesMock,
  listCurrentUserIndexPages: listCurrentUserIndexPagesMock,
  listCurrentSystemIndexes: listCurrentSystemIndexesMock,
  listCurrentSystemIndexPages: listCurrentSystemIndexPagesMock,
}));

describe("AccountIndexesPage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getClaimsMock.mockReset();
    getOrCreateUserProfileMock.mockReset();
    listCurrentUserIndexesMock.mockReset();
    listCurrentUserIndexesMock.mockResolvedValue([]);
    listCurrentUserIndexPagesMock.mockReset();
    listCurrentUserIndexPagesMock.mockResolvedValue({ pages: [], totalCount: 0 });
    listCurrentSystemIndexesMock.mockReset();
    listCurrentSystemIndexesMock.mockResolvedValue([]);
    listCurrentSystemIndexPagesMock.mockReset();
    listCurrentSystemIndexPagesMock.mockResolvedValue({ pages: [], totalCount: 0 });
  });

  it("redirects anonymous visitors to login", async () => {
    getClaimsMock.mockResolvedValue({ data: null });

    await AccountIndexesPage();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("shows an empty state when the user has no indexes", async () => {
    getClaimsMock.mockResolvedValue({ data: { claims: { sub: "user-1", email: "reader@example.com" } } });
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

  it("loads the first scope page by default and switches to the requested scope", async () => {
    getClaimsMock.mockResolvedValue({ data: { claims: { sub: "user-1", email: "reader@example.com" } } });
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
        updatedAt: "2026-06-12T08:00:00.000Z",
      },
    ]);
    listCurrentUserIndexPagesMock.mockResolvedValue({
      pages: [{
        id: "page-1",
        userIndexId: "user-index-1",
        url: "https://react.dev/learn",
        title: "Quick Start",
        viewedHeight: 500,
        progressPercent: 50,
      }],
      totalCount: 42,
    });

    render(await AccountIndexesPage());

    expect(screen.queryByText("Sync a system index")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /react learn.*2/i })).toHaveAttribute("href", "/account/indexes?site=react.dev&index=user-index-1");
    expect(screen.getByText("Quick Start")).toBeInTheDocument();
    expect(listCurrentUserIndexPagesMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: "user-index-1", indexId: "index-1" }),
      1,
      20,
    );

    render(await AccountIndexesPage({ searchParams: Promise.resolve({ site: "react.dev", index: "user-index-1", page: "2" }) }));

    expect(screen.getAllByText("Quick Start")).toHaveLength(2);
    expect(screen.getByText("Page 2 of 3 · 20 per page")).toBeInTheDocument();
    expect(listCurrentUserIndexPagesMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: "user-index-1", indexId: "index-1" }),
      2,
      20,
    );
  });

  it("shows searchable system indexes on a separate view", async () => {
    getClaimsMock.mockResolvedValue({ data: { claims: { sub: "user-1", email: "reader@example.com" } } });
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
      },
    ]);
    listCurrentSystemIndexPagesMock.mockResolvedValue({
      pages: [{
        id: "page-1",
        url: "https://react.dev/learn",
        title: "Quick Start",
        order: 0,
        contentHeight: 1000,
        updatedAt: "2026-06-12T08:00:00.000Z",
      }],
      totalCount: 1,
    });

    render(
      await AccountIndexesPage({
        searchParams: Promise.resolve({ view: "system", host: "react.dev", site: "react.dev", index: "system-index-1" }),
      }),
    );

    expect(screen.getByRole("link", { name: "System indexes", current: "page" })).toHaveAttribute(
      "href",
      "/account/indexes?view=system",
    );
    expect(screen.getByRole("textbox", { name: /search system indexes by host/i })).toHaveValue("react.dev");
    expect(screen.getByRole("complementary", { name: /system index directory/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /react learn.*1/i, current: "page" })).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: /selected system index detail/i })).getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /system index pages/i })).toBeInTheDocument();
    expect(screen.getByText("Quick Start")).toBeInTheDocument();
    expect(listCurrentSystemIndexesMock).toHaveBeenCalledWith(expect.anything(), { host: "react.dev" });
    expect(listCurrentSystemIndexPagesMock).toHaveBeenCalledWith(expect.anything(), "system-index-1", 1, 20);
  });
});
