import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const exchangeCodeForSessionMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
    },
  }),
}));

describe("auth confirm route", () => {
  beforeEach(() => {
    exchangeCodeForSessionMock.mockReset();
  });

  it("exchanges the auth code and redirects to account", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });

    const response = await GET(new Request("https://example.com/auth/confirm?code=abc"));

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("abc");
    expect(response.headers.get("location")).toBe("https://example.com/account");
  });

  it("redirects missing or invalid codes to login with a confirmation error", async () => {
    const response = await GET(new Request("https://example.com/auth/confirm"));

    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://example.com/login?message=confirmation-failed",
    );
  });
});
