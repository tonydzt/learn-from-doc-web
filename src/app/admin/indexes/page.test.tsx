import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminIndexesPage from "./page";

const {
  cookiesMock,
  verifyAdminSessionCookieValueMock,
  getAdminIndexRawSnapshotMock,
  listAdminIndexPagesMock,
  listPendingReviewIndexesMock,
  listSystemAdminIndexesMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  verifyAdminSessionCookieValueMock: vi.fn(),
  getAdminIndexRawSnapshotMock: vi.fn(),
  listAdminIndexPagesMock: vi.fn(),
  listPendingReviewIndexesMock: vi.fn(),
  listSystemAdminIndexesMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/waitlistAdminAuth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/waitlistAdminAuth")>()),
  verifyAdminSessionCookieValue: verifyAdminSessionCookieValueMock,
  waitlistAdminCookieName: "waitlist_admin_session",
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: () => ({ from: vi.fn() }),
}));

vi.mock("@/lib/indexes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/indexes")>()),
  getAdminIndexRawSnapshot: getAdminIndexRawSnapshotMock,
  listAdminIndexPages: listAdminIndexPagesMock,
  listPendingReviewIndexes: listPendingReviewIndexesMock,
  listSystemAdminIndexes: listSystemAdminIndexesMock,
}));

describe("AdminIndexesPage", () => {
  beforeEach(() => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "cookie" }) });
    verifyAdminSessionCookieValueMock.mockReset();
    getAdminIndexRawSnapshotMock.mockReset();
    getAdminIndexRawSnapshotMock.mockResolvedValue({ schemaVersion: 1 });
    listAdminIndexPagesMock.mockReset();
    listAdminIndexPagesMock.mockResolvedValue([]);
    listSystemAdminIndexesMock.mockReset();
    listPendingReviewIndexesMock.mockReset();
    listPendingReviewIndexesMock.mockResolvedValue([]);
  });

  it("shows system indexes to authenticated admins", async () => {
    listSystemAdminIndexesMock.mockResolvedValue([
      {
        id: "index-1",
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        pageCount: 51,
        version: "v1",
        updatedAt: "2026-06-12T08:00:00.000Z",
        systemStatus: "active",
      },
    ]);

    render(
      await AdminIndexesPage(),
    );

    expect(screen.getByRole("complementary", { name: /index directory/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /react learn.*51/i, current: "page" })).toHaveAttribute(
      "href",
      "/admin/indexes?index=index-1",
    );
    expect(screen.getByRole("heading", { name: "React Learn" })).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark active/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rebuild page records from snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete system index/i })).toBeInTheDocument();
    expect(listSystemAdminIndexesMock).toHaveBeenCalledWith(expect.anything());
    expect(listAdminIndexPagesMock).toHaveBeenCalledWith(expect.anything(), "index-1");
    expect(getAdminIndexRawSnapshotMock).toHaveBeenCalledWith(expect.anything(), "index-1");
  });

  it("shows submitted scopes in the directory and their review actions inline", async () => {
    listSystemAdminIndexesMock.mockResolvedValue([]);
    listPendingReviewIndexesMock.mockResolvedValue([
      {
        id: "pending-1",
        siteId: "playwright.dev::python",
        host: "playwright.dev",
        scopeKey: "python",
        scopeTitle: "Playwright Python",
        pageCount: 45,
        version: "v2",
        submittedAt: "2026-06-12T08:00:00.000Z",
      },
      {
        id: "pending-2",
        siteId: "playwright.dev::java",
        host: "playwright.dev",
        scopeKey: "java",
        scopeTitle: "Playwright Java",
        pageCount: 38,
        version: "v2",
        submittedAt: "2026-06-12T08:01:00.000Z",
      },
    ]);

    render(await AdminIndexesPage({ searchParams: Promise.resolve({ index: "pending-1" }) }));

    expect(screen.getByRole("region", { name: /pending review/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /playwright python.*45/i, current: "page" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /selected index/i })).toHaveTextContent("Pending review");
    expect(screen.getByRole("button", { name: /approve as system index/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve all 2 pending scopes from playwright.dev/i })).toHaveTextContent("Approve 2");
    expect(screen.getByRole("button", { name: /reject submission/i })).toBeInTheDocument();
    expect(listAdminIndexPagesMock).toHaveBeenCalledWith(expect.anything(), "pending-1");
  });
});
