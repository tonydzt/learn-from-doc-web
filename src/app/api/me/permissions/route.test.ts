import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const {
  createApiSupabaseClientMock,
  getUserMock,
  getCurrentUserPermissionsMock,
  getOrCreateUserProfileMock,
} = vi.hoisted(() => ({
    createApiSupabaseClientMock: vi.fn(),
    getUserMock: vi.fn(),
    getCurrentUserPermissionsMock: vi.fn(),
    getOrCreateUserProfileMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/api", () => ({
  createApiSupabaseClient: createApiSupabaseClientMock,
}));

vi.mock("@/lib/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/permissions")>()),
  getCurrentUserPermissions: getCurrentUserPermissionsMock,
}));

vi.mock("@/lib/profiles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/profiles")>()),
  getOrCreateUserProfile: getOrCreateUserProfileMock,
}));

describe("GET /api/me/permissions", () => {
  beforeEach(() => {
    createApiSupabaseClientMock.mockReset();
    createApiSupabaseClientMock.mockReturnValue({
      auth: {
        getUser: getUserMock,
      },
    });
    getUserMock.mockReset();
    getCurrentUserPermissionsMock.mockReset();
    getOrCreateUserProfileMock.mockReset();
  });

  it("returns user info and permission booleans for a valid bearer token", async () => {
    const user = { id: "user-1", email: "reader@example.com" };
    getUserMock.mockResolvedValue({ data: { user }, error: null });
    getOrCreateUserProfileMock.mockResolvedValue({
      userId: "user-1",
      nickname: "Reader01",
      avatarInitial: "R",
      avatarBackground: "#174E63",
      avatarColor: "#F9C846",
    });
    getCurrentUserPermissionsMock.mockResolvedValue({
      canSync: { active: true, expiresAt: "2028-01-01T00:00:00.000Z" },
      canPullServerData: { active: false, expiresAt: null },
    });

    const response = await GET(
      new Request("http://localhost/api/me/permissions", {
        headers: { Authorization: "Bearer access-token-1" },
      }),
    );

    expect(createApiSupabaseClientMock).toHaveBeenCalledWith("access-token-1");
    expect(getUserMock).toHaveBeenCalledWith("access-token-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: {
        id: "user-1",
        email: "reader@example.com",
        name: "Reader01",
      },
      permissions: {
        canSync: true,
        canPullServerData: false,
      },
    });
  });

  it("returns 401 when the bearer token is missing", async () => {
    const response = await GET(new Request("http://localhost/api/me/permissions"));

    expect(response.status).toBe(401);
  });

  it("returns 401 when the bearer token is invalid", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "bad token" } });

    const response = await GET(
      new Request("http://localhost/api/me/permissions", {
        headers: { Authorization: "Bearer bad-token" },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when permissions cannot be refreshed", async () => {
    getUserMock.mockRejectedValue(new Error("network unavailable"));

    const response = await GET(
      new Request("http://localhost/api/me/permissions", {
        headers: { Authorization: "Bearer access-token-1" },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Could not refresh permissions",
    });
  });
});
