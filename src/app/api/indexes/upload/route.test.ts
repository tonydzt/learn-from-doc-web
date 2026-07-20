import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const { requireApiUserPermissionMock, uploadUserIndexesMock, supabase } = vi.hoisted(() => ({
  requireApiUserPermissionMock: vi.fn(),
  uploadUserIndexesMock: vi.fn(),
  supabase: { from: vi.fn() },
}));

vi.mock("@/lib/api-auth", () => ({
  requireApiUserPermission: requireApiUserPermissionMock,
}));

vi.mock("@/lib/indexes", () => ({
  uploadUserIndexes: uploadUserIndexesMock,
}));

describe("POST /api/indexes/upload", () => {
  beforeEach(() => {
    requireApiUserPermissionMock.mockReset();
    uploadUserIndexesMock.mockReset();
  });

  it("requires canSync and uploads indexes for the current user", async () => {
    requireApiUserPermissionMock.mockResolvedValue({ ok: true, userId: "user-1", supabase });
    uploadUserIndexesMock.mockResolvedValue({ ok: true, serverUpdatedAt: 1000, siteCount: 1 });

    const response = await POST(
      new Request("http://localhost/api/indexes/upload", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaVersion: 1,
          clientUpdatedAt: 1,
          payload: { schemaVersion: 1, exportedAt: 1, scope: "all", includeProgress: true, sites: [] },
        }),
      }),
    );

    expect(requireApiUserPermissionMock).toHaveBeenCalledWith(expect.any(Request), "canSync");
    expect(uploadUserIndexesMock).toHaveBeenCalledWith(supabase, "user-1", expect.objectContaining({ schemaVersion: 1 }));
    expect(response.status).toBe(200);
  });

  it("returns the auth helper response when the user lacks permission", async () => {
    const authResponse = Response.json({ error: "Forbidden" }, { status: 403 });
    requireApiUserPermissionMock.mockResolvedValue({ ok: false, response: authResponse });

    const response = await POST(new Request("http://localhost/api/indexes/upload", { method: "POST", body: "{}" }));

    expect(response.status).toBe(403);
    expect(uploadUserIndexesMock).not.toHaveBeenCalled();
  });

  it("returns 500 when the upload write fails", async () => {
    requireApiUserPermissionMock.mockResolvedValue({ ok: true, userId: "user-1", supabase });
    uploadUserIndexesMock.mockRejectedValue(new Error("there is no unique or exclusion constraint"));

    const response = await POST(
      new Request("http://localhost/api/indexes/upload", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaVersion: 1,
          clientUpdatedAt: 1,
          payload: { schemaVersion: 1, exportedAt: 1, scope: "all", includeProgress: true, sites: [] },
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Could not upload indexes" });
  });
});
