import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const {
  adminSupabase,
  createAdminSupabaseClientMock,
  getCurrentUserPermissionsMock,
  pullPendingReviewIndexMock,
  requireApiUserPermissionMock,
  supabase,
} = vi.hoisted(() => ({
  adminSupabase: { from: vi.fn() },
  createAdminSupabaseClientMock: vi.fn(),
  getCurrentUserPermissionsMock: vi.fn(),
  pullPendingReviewIndexMock: vi.fn(),
  requireApiUserPermissionMock: vi.fn(),
  supabase: { from: vi.fn() },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

vi.mock("@/lib/api-auth", () => ({
  requireApiUserPermission: requireApiUserPermissionMock,
}));

vi.mock("@/lib/indexes", () => ({
  pullPendingReviewIndex: pullPendingReviewIndexMock,
}));

vi.mock("@/lib/permissions", () => ({
  getCurrentUserPermissions: getCurrentUserPermissionsMock,
}));

describe("GET /api/indexes/review-pull", () => {
  beforeEach(() => {
    getCurrentUserPermissionsMock.mockReset();
    pullPendingReviewIndexMock.mockReset();
    requireApiUserPermissionMock.mockReset();
    createAdminSupabaseClientMock.mockReset();
    createAdminSupabaseClientMock.mockReturnValue(adminSupabase);
  });

  it("requires siteId", async () => {
    const response = await GET(new Request("http://localhost/api/indexes/review-pull"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "siteId is required" });
  });

  it("returns 403 when the user is not a system index tester", async () => {
    requireApiUserPermissionMock.mockResolvedValue({ ok: true, userId: "user-1", supabase });
    getCurrentUserPermissionsMock.mockResolvedValue({
      canPullServerData: { active: true, expiresAt: null },
      canTestSystemIndexes: { active: false, expiresAt: null },
      canSync: { active: false, expiresAt: null },
    });

    const response = await GET(
      new Request("http://localhost/api/indexes/review-pull?siteId=react.dev%3A%3Alearn"),
    );

    expect(requireApiUserPermissionMock).toHaveBeenCalledWith(expect.any(Request), "canPullServerData");
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "System index testing is not enabled for this account",
    });
    expect(createAdminSupabaseClientMock).not.toHaveBeenCalled();
  });

  it("returns pending portable data for testers", async () => {
    requireApiUserPermissionMock.mockResolvedValue({ ok: true, userId: "user-1", supabase });
    getCurrentUserPermissionsMock.mockResolvedValue({
      canPullServerData: { active: true, expiresAt: null },
      canTestSystemIndexes: { active: true, expiresAt: null },
      canSync: { active: false, expiresAt: null },
    });
    pullPendingReviewIndexMock.mockResolvedValue({ ok: true, serverUpdatedAt: null, payload: null });

    const response = await GET(
      new Request("http://localhost/api/indexes/review-pull?siteId=react.dev%3A%3Alearn"),
    );

    expect(createAdminSupabaseClientMock).toHaveBeenCalledOnce();
    expect(pullPendingReviewIndexMock).toHaveBeenCalledWith(adminSupabase, "react.dev::learn");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, serverUpdatedAt: null, payload: null });
  });
});
