import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminIndexesPage from "./page";

const {
  cookiesMock,
  verifyAdminSessionCookieValueMock,
  listPendingReviewIndexesMock,
  listSystemAdminIndexesMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  verifyAdminSessionCookieValueMock: vi.fn(),
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
  listPendingReviewIndexes: listPendingReviewIndexesMock,
  listSystemAdminIndexes: listSystemAdminIndexesMock,
}));

describe("AdminIndexesPage", () => {
  beforeEach(() => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "cookie" }) });
    verifyAdminSessionCookieValueMock.mockReset();
    listPendingReviewIndexesMock.mockReset();
    listPendingReviewIndexesMock.mockResolvedValue([]);
    listSystemAdminIndexesMock.mockReset();
  });

  it("shows system indexes to authenticated admins", async () => {
    listSystemAdminIndexesMock.mockResolvedValue([
      {
        id: "index-1",
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeTitle: "React Learn",
        pageCount: 51,
        version: "v1",
        updatedAt: "2026-06-12T08:00:00.000Z",
      },
    ]);

    render(
      await AdminIndexesPage({
        searchParams: Promise.resolve({ siteId: "react.dev::learn", host: "react.dev" }),
      }),
    );

    const table = screen.getByRole("table", { name: /system indexes/i });
    expect(within(table).getByText("React Learn")).toBeInTheDocument();
    expect(within(table).getByText("51")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view react learn/i })).toHaveAttribute(
      "href",
      "/admin/indexes/index-1",
    );
    expect(listSystemAdminIndexesMock).toHaveBeenCalledWith(expect.anything(), {
      siteId: "react.dev::learn",
      host: "react.dev",
    });
    expect(listPendingReviewIndexesMock).toHaveBeenCalledWith(expect.anything(), {
      siteId: "react.dev::learn",
      host: "react.dev",
    });
  });
});
