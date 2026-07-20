import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminIndexDetailPage from "./page";

const {
  cookiesMock,
  verifyAdminSessionCookieValueMock,
  getAdminIndexDetailMock,
  listAdminIndexPagesMock,
  getAdminIndexRawSnapshotMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  verifyAdminSessionCookieValueMock: vi.fn(),
  getAdminIndexDetailMock: vi.fn(),
  listAdminIndexPagesMock: vi.fn(),
  getAdminIndexRawSnapshotMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@/lib/waitlistAdminAuth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/waitlistAdminAuth")>()),
  verifyAdminSessionCookieValue: verifyAdminSessionCookieValueMock,
  waitlistAdminCookieName: "waitlist_admin_session",
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: () => ({ from: vi.fn() }) }));
vi.mock("@/lib/indexes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/indexes")>()),
  getAdminIndexDetail: getAdminIndexDetailMock,
  listAdminIndexPages: listAdminIndexPagesMock,
  getAdminIndexRawSnapshot: getAdminIndexRawSnapshotMock,
}));

describe("AdminIndexDetailPage", () => {
  beforeEach(() => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "cookie" }) });
    verifyAdminSessionCookieValueMock.mockReturnValue(true);
    getAdminIndexDetailMock.mockReset();
    listAdminIndexPagesMock.mockReset();
    getAdminIndexRawSnapshotMock.mockReset();
  });

  it("shows structured fields, pages, and raw snapshot", async () => {
    getAdminIndexDetailMock.mockResolvedValue({
      id: "index-1",
      source: "system",
      system_status: "active",
      review_status: "approved",
      site_id: "react.dev::learn",
      host: "react.dev",
      scope_key: "learn",
      scope_title: "React Learn",
      version: "v1",
      page_count: 1,
      updated_at: "2026-06-12T08:00:00.000Z",
    });
    listAdminIndexPagesMock.mockResolvedValue([
      {
        id: "page-1",
        title: "Quick Start",
        url: "https://react.dev/learn",
        order: 0,
        content_height: 1200,
        updated_at: "2026-06-12T08:00:00.000Z",
      },
    ]);
    getAdminIndexRawSnapshotMock.mockResolvedValue({ schemaVersion: 1 });

    render(await AdminIndexDetailPage({ params: Promise.resolve({ indexId: "index-1" }) }));

    expect(screen.getByRole("heading", { name: "React Learn" })).toBeInTheDocument();
    expect(screen.getByText("react.dev::learn")).toBeInTheDocument();
    const pagesTable = screen.getByRole("table", { name: /index pages/i });
    expect(within(pagesTable).getByText("Quick Start")).toBeInTheDocument();
    expect(screen.getByText(/schemaVersion/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete system index/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark active/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rebuild pages from snapshot/i })).toBeInTheDocument();
  });
});
