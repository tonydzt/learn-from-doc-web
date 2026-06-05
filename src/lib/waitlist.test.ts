import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  notifyWaitlistSubscribers,
  subscribeToWaitlist,
  validateWaitlistRequest,
} from "./waitlist";

const originalEnv = process.env;

describe("waitlist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      RESEND_API_KEY: "resend-key",
      WAITLIST_NOTIFY_FROM: "Developer Docs <updates@example.com>",
    };
  });

  it("rejects invalid email addresses", () => {
    const result = validateWaitlistRequest({
      email: "not-an-email",
      interestedFeatures: ["user_accounts"],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/valid email/i);
    }
  });

  it("rejects empty feature selections", () => {
    const result = validateWaitlistRequest({
      email: "reader@example.com",
      interestedFeatures: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/future feature/i);
    }
  });

  it("upserts duplicate emails instead of creating a second subscriber", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "subscriber-1", email: "reader@example.com" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await subscribeToWaitlist({
      email: "Reader@Example.com",
      interestedFeatures: ["user_accounts", "cross_device_sync"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/rest/v1/waitlist_subscribers?on_conflict=email",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Prefer: "resolution=merge-duplicates,return=representation",
        }),
        body: expect.stringContaining('"email":"reader@example.com"'),
      }),
    );
  });

  it("returns a useful error when Supabase rejects the subscription", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "relation does not exist",
      }),
    );

    await expect(
      subscribeToWaitlist({
        email: "reader@example.com",
        interestedFeatures: ["user_accounts"],
      }),
    ).rejects.toThrow(/could not save/i);
  });

  it("continues sending a notification when one recipient fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: "sub-1", email: "first@example.com" },
          { id: "sub-2", email: "second@example.com" },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "notification-1" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-1" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        text: async () => "domain not verified",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await notifyWaitlistSubscribers({
      subject: "Your feature is ready",
      body: "The requested feature is now available.",
    });

    expect(result).toMatchObject({
      total: 2,
      sent: 1,
      failed: 1,
    });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("handles successful Supabase writes that return an empty body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "sub-1", email: "first@example.com" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "notification-1" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      notifyWaitlistSubscribers({
        subject: "Your feature is ready",
        body: "The requested feature is now available.",
      }),
    ).resolves.toMatchObject({
      total: 1,
      sent: 1,
      failed: 0,
    });
  });
});
