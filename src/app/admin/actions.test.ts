import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginAdmin } from "./actions";

const { cookiesMock, revalidatePathMock, verifyAdminPasswordMock, cookieSetMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  verifyAdminPasswordMock: vi.fn(),
  cookieSetMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/waitlistAdminAuth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/waitlistAdminAuth")>()),
  verifyAdminPassword: verifyAdminPasswordMock,
  createAdminSessionCookieValue: () => "session-value",
  waitlistAdminCookieName: "waitlist_admin_session",
}));

describe("admin actions", () => {
  beforeEach(() => {
    cookiesMock.mockResolvedValue({ set: cookieSetMock });
    cookieSetMock.mockReset();
    revalidatePathMock.mockReset();
    verifyAdminPasswordMock.mockReset();
  });

  it("sets the shared admin cookie for all admin routes", async () => {
    verifyAdminPasswordMock.mockReturnValue(true);
    const formData = new FormData();
    formData.set("password", "secret");
    formData.set("returnPath", "/admin/indexes");

    await loginAdmin(formData);

    expect(cookieSetMock).toHaveBeenCalledWith(
      "waitlist_admin_session",
      "session-value",
      expect.objectContaining({ path: "/admin" }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/indexes");
  });
});
