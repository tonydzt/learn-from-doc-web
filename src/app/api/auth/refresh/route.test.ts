import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const { refreshSessionMock } = vi.hoisted(() => ({
  refreshSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({
    auth: {
      refreshSession: refreshSessionMock,
    },
  }),
}));

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    refreshSessionMock.mockReset();
  });

  it("returns a refreshed session", async () => {
    refreshSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          expires_at: 1782198578,
        },
      },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "old-refresh-token" }),
      }),
    );

    expect(refreshSessionMock).toHaveBeenCalledWith({
      refresh_token: "old-refresh-token",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      expiresAt: 1782198578,
    });
  });

  it("returns 400 when refreshToken is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(refreshSessionMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "refreshToken is required" });
  });

  it("returns 401 when the refresh token is invalid", async () => {
    refreshSessionMock.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid refresh token" },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "bad-refresh-token" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid refresh token" });
  });
});
