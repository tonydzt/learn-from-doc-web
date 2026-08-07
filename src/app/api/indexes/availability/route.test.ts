import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const {
  createAdminSupabaseClientMock,
  getCurrentUserPermissionsMock,
  getIndexAvailabilityMock,
  getPendingReviewIndexAvailabilityMock,
  requireApiUserPermissionMock,
  adminSupabase,
  supabase,
} = vi.hoisted(() => ({
  createAdminSupabaseClientMock: vi.fn(),
  getCurrentUserPermissionsMock: vi.fn(),
  getIndexAvailabilityMock: vi.fn(),
  getPendingReviewIndexAvailabilityMock: vi.fn(),
  requireApiUserPermissionMock: vi.fn(),
  adminSupabase: { from: vi.fn() },
  supabase: { from: vi.fn() },
}));

vi.mock("@/lib/api-auth", () => ({
  requireApiUserPermission: requireApiUserPermissionMock,
}));

vi.mock("@/lib/indexes", () => ({
  getIndexAvailability: getIndexAvailabilityMock,
  getPendingReviewIndexAvailability: getPendingReviewIndexAvailabilityMock,
}));

vi.mock("@/lib/permissions", () => ({
  getCurrentUserPermissions: getCurrentUserPermissionsMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

describe("GET /api/indexes/availability", () => {
  beforeEach(() => {
    createAdminSupabaseClientMock.mockReset();
    getCurrentUserPermissionsMock.mockReset();
    getIndexAvailabilityMock.mockReset();
    getPendingReviewIndexAvailabilityMock.mockReset();
    requireApiUserPermissionMock.mockReset();
    createAdminSupabaseClientMock.mockReturnValue(adminSupabase);
  });

  it("returns 400 when siteId is missing", async () => {
    const response = await GET(new Request("http://localhost/api/indexes/availability"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "siteId is required" });
    expect(requireApiUserPermissionMock).not.toHaveBeenCalled();
  });

  it("requires canPullServerData permission", async () => {
    const authResponse = Response.json({ error: "Forbidden" }, { status: 403 });
    requireApiUserPermissionMock.mockResolvedValue({ ok: false, response: authResponse });

    const response = await GET(
      new Request("http://localhost/api/indexes/availability?siteId=react.dev%3A%3Alearn", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(requireApiUserPermissionMock).toHaveBeenCalledWith(expect.any(Request), "canPullServerData");
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Server data pull is not enabled for this account",
    });
  });

  it("passes through unauthorized responses", async () => {
    const authResponse = Response.json({ error: "Unauthorized" }, { status: 401 });
    requireApiUserPermissionMock.mockResolvedValue({ ok: false, response: authResponse });

    const response = await GET(
      new Request("http://localhost/api/indexes/availability?siteId=react.dev%3A%3Alearn"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns availability for the current user and site", async () => {
    requireApiUserPermissionMock.mockResolvedValue({ ok: true, userId: "user-1", supabase });
    getIndexAvailabilityMock.mockResolvedValue({
      available: true,
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        pageCount: 42,
        updatedAt: "2026-06-11T08:00:00.000Z",
      },
      kinds: ["system"],
    });
    getCurrentUserPermissionsMock.mockResolvedValue({
      canPullServerData: { active: true, expiresAt: null },
      canTestSystemIndexes: { active: false, expiresAt: null },
      canSync: { active: false, expiresAt: null },
    });

    const response = await GET(
      new Request("http://localhost/api/indexes/availability?siteId=react.dev%3A%3Alearn", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(getIndexAvailabilityMock).toHaveBeenCalledWith(supabase, "user-1", "react.dev::learn");
    expect(getCurrentUserPermissionsMock).toHaveBeenCalledWith(supabase, "user-1");
    expect(createAdminSupabaseClientMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      available: true,
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        pageCount: 42,
        updatedAt: "2026-06-11T08:00:00.000Z",
      },
      kinds: ["system"],
    });
  });

  it("returns pending review availability for system index testers", async () => {
    requireApiUserPermissionMock.mockResolvedValue({ ok: true, userId: "user-1", supabase });
    getIndexAvailabilityMock.mockResolvedValue({ available: false });
    getCurrentUserPermissionsMock.mockResolvedValue({
      canPullServerData: { active: true, expiresAt: null },
      canTestSystemIndexes: { active: true, expiresAt: null },
      canSync: { active: false, expiresAt: null },
    });
    getPendingReviewIndexAvailabilityMock.mockResolvedValue({
      available: true,
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        pageCount: 42,
        updatedAt: "2026-06-11T08:00:00.000Z",
      },
      kinds: ["pending_review"],
    });

    const response = await GET(
      new Request("http://localhost/api/indexes/availability?siteId=react.dev%3A%3Alearn", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(getCurrentUserPermissionsMock).toHaveBeenCalledWith(supabase, "user-1");
    expect(createAdminSupabaseClientMock).toHaveBeenCalledOnce();
    expect(getPendingReviewIndexAvailabilityMock).toHaveBeenCalledWith(
      adminSupabase,
      "react.dev::learn",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      available: true,
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        pageCount: 42,
        updatedAt: "2026-06-11T08:00:00.000Z",
      },
      kinds: ["pending_review"],
    });
  });

  it("returns all available kinds for testers", async () => {
    requireApiUserPermissionMock.mockResolvedValue({ ok: true, userId: "user-1", supabase });
    getIndexAvailabilityMock.mockResolvedValue({
      available: true,
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        pageCount: 42,
        updatedAt: "2026-06-11T08:00:00.000Z",
      },
      kinds: ["system"],
    });
    getCurrentUserPermissionsMock.mockResolvedValue({
      canPullServerData: { active: true, expiresAt: null },
      canTestSystemIndexes: { active: true, expiresAt: null },
      canSync: { active: false, expiresAt: null },
    });
    getPendingReviewIndexAvailabilityMock.mockResolvedValue({
      available: true,
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "Pending React Learn",
        pageCount: 4,
        updatedAt: "2026-06-12T08:00:00.000Z",
      },
      kinds: ["pending_review"],
    });

    const response = await GET(
      new Request("http://localhost/api/indexes/availability?siteId=react.dev%3A%3Alearn", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(createAdminSupabaseClientMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      available: true,
      site: {
        scopeTitle: "React Learn",
      },
      kinds: ["system", "pending_review"],
    });
  });

  it("does not check pending review availability for non-testers", async () => {
    requireApiUserPermissionMock.mockResolvedValue({ ok: true, userId: "user-1", supabase });
    getIndexAvailabilityMock.mockResolvedValue({ available: false });
    getCurrentUserPermissionsMock.mockResolvedValue({
      canPullServerData: { active: true, expiresAt: null },
      canTestSystemIndexes: { active: false, expiresAt: null },
      canSync: { active: false, expiresAt: null },
    });

    const response = await GET(
      new Request("http://localhost/api/indexes/availability?siteId=react.dev%3A%3Alearn", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(createAdminSupabaseClientMock).not.toHaveBeenCalled();
    expect(getPendingReviewIndexAvailabilityMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ available: false });
  });
});
