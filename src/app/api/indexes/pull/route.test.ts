import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const { requireApiUserPermissionMock, pullUserIndexesMock, supabase } = vi.hoisted(() => ({
  requireApiUserPermissionMock: vi.fn(),
  pullUserIndexesMock: vi.fn(),
  supabase: { from: vi.fn() },
}));

vi.mock("@/lib/api-auth", () => ({
  requireApiUserPermission: requireApiUserPermissionMock,
}));

vi.mock("@/lib/indexes", () => ({
  pullUserIndexes: pullUserIndexesMock,
}));

describe("GET /api/indexes/pull", () => {
  beforeEach(() => {
    requireApiUserPermissionMock.mockReset();
    pullUserIndexesMock.mockReset();
  });

  it("requires canPullServerData and returns portable data", async () => {
    requireApiUserPermissionMock.mockResolvedValue({ ok: true, userId: "user-1", supabase });
    pullUserIndexesMock.mockResolvedValue({ ok: true, serverUpdatedAt: null, payload: null });

    const response = await GET(
      new Request("http://localhost/api/indexes/pull", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(requireApiUserPermissionMock).toHaveBeenCalledWith(expect.any(Request), "canPullServerData");
    expect(pullUserIndexesMock).toHaveBeenCalledWith(supabase, "user-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, serverUpdatedAt: null, payload: null });
  });
});
