import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const { signInWithPasswordMock, getCurrentUserPermissionsMock, getOrCreateUserProfileMock } =
  vi.hoisted(() => ({
    signInWithPasswordMock: vi.fn(),
    getCurrentUserPermissionsMock: vi.fn(),
    getOrCreateUserProfileMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
    },
  }),
}));

vi.mock("@/lib/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/permissions")>()),
  getCurrentUserPermissions: getCurrentUserPermissionsMock,
}));

vi.mock("@/lib/profiles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/profiles")>()),
  getOrCreateUserProfile: getOrCreateUserProfileMock,
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    getCurrentUserPermissionsMock.mockReset();
    getOrCreateUserProfileMock.mockReset();
  });

  it("returns an access token, user, and permission booleans after login", async () => {
    const user = { id: "user-1", email: "reader@example.com" };
    signInWithPasswordMock.mockResolvedValue({
      data: {
        session: { access_token: "access-token-1" },
        user,
      },
      error: null,
    });
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

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: " Reader@Example.com ", password: "password123" }),
      }),
    );

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "password123",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      accessToken: "access-token-1",
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

  it("returns 401 for invalid credentials", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Invalid login credentials" },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "reader@example.com", password: "password123" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid email or password" });
  });

  it("returns 400 for malformed input", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "password123" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Enter a valid email address." });
  });
});
