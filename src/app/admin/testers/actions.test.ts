import { beforeEach, describe, expect, it, vi } from "vitest";

import { addSystemIndexTester, removeSystemIndexTester } from "./actions";

const {
  cookiesMock,
  createAdminSupabaseClientMock,
  grantSystemIndexTesterMock,
  redirectMock,
  revalidatePathMock,
  revokeSystemIndexTesterMock,
  verifyAdminSessionCookieValueMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createAdminSupabaseClientMock: vi.fn(),
  grantSystemIndexTesterMock: vi.fn(),
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  revokeSystemIndexTesterMock: vi.fn(),
  verifyAdminSessionCookieValueMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));
vi.mock("@/lib/system-index-testers", () => ({
  grantSystemIndexTester: grantSystemIndexTesterMock,
  revokeSystemIndexTester: revokeSystemIndexTesterMock,
}));
vi.mock("@/lib/waitlistAdminAuth", () => ({
  verifyAdminSessionCookieValue: verifyAdminSessionCookieValueMock,
  waitlistAdminCookieName: "waitlist_admin_session",
}));

describe("admin tester actions", () => {
  beforeEach(() => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "cookie" }) });
    createAdminSupabaseClientMock.mockReset();
    createAdminSupabaseClientMock.mockReturnValue({ from: vi.fn() });
    grantSystemIndexTesterMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    revokeSystemIndexTesterMock.mockReset();
    verifyAdminSessionCookieValueMock.mockReset();
  });

  it("rejects add attempts without a valid admin session", async () => {
    verifyAdminSessionCookieValueMock.mockReturnValue(false);
    const formData = new FormData();
    formData.set("email", "tester@example.com");

    await addSystemIndexTester(formData);

    expect(createAdminSupabaseClientMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/admin/testers?error=Unauthorized");
  });

  it("adds a tester and refreshes the admin page", async () => {
    verifyAdminSessionCookieValueMock.mockReturnValue(true);
    grantSystemIndexTesterMock.mockResolvedValue({
      ok: true,
      userId: "user-1",
      email: "tester@example.com",
    });
    const formData = new FormData();
    formData.set("email", "tester@example.com");

    await addSystemIndexTester(formData);

    expect(grantSystemIndexTesterMock).toHaveBeenCalledWith(
      expect.anything(),
      "tester@example.com",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/testers");
    expect(redirectMock).toHaveBeenCalledWith("/admin/testers?status=added");
  });

  it("preserves validation feedback when redirect throws", async () => {
    verifyAdminSessionCookieValueMock.mockReturnValue(true);
    grantSystemIndexTesterMock.mockResolvedValue({
      ok: false,
      message: "No account exists for that email address.",
    });
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    const formData = new FormData();
    formData.set("email", "missing@example.com");

    await expect(addSystemIndexTester(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith(
      "/admin/testers?error=No%20account%20exists%20for%20that%20email%20address.",
    );
  });

  it("removes a tester and refreshes the admin page", async () => {
    verifyAdminSessionCookieValueMock.mockReturnValue(true);
    revokeSystemIndexTesterMock.mockResolvedValue(undefined);
    const formData = new FormData();
    formData.set("userId", "user-1");

    await removeSystemIndexTester(formData);

    expect(revokeSystemIndexTesterMock).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/testers");
    expect(redirectMock).toHaveBeenCalledWith("/admin/testers?status=removed");
  });
});
