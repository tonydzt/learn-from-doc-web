import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("returns 400 for an invalid email", async () => {
    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        body: JSON.stringify({
          email: "not-an-email",
          interestedFeatures: ["user_accounts"],
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: expect.stringMatching(/valid email/i),
    });
  });

  it("returns ok after saving a reservation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: "subscriber-1" }],
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        body: JSON.stringify({
          email: "reader@example.com",
          interestedFeatures: ["user_accounts"],
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
