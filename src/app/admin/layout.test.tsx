import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminLayout from "./layout";

const { cookiesMock, verifyAdminSessionCookieValueMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  verifyAdminSessionCookieValueMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/waitlistAdminAuth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/waitlistAdminAuth")>()),
  verifyAdminSessionCookieValue: verifyAdminSessionCookieValueMock,
  waitlistAdminCookieName: "waitlist_admin_session",
}));

describe("AdminLayout", () => {
  beforeEach(() => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "cookie" }) });
    verifyAdminSessionCookieValueMock.mockReset();
  });

  it("shows the admin login when not authenticated", async () => {
    verifyAdminSessionCookieValueMock.mockReturnValue(false);

    render(await AdminLayout({ children: <p>Hidden admin content</p> }));

    expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument();
    expect(screen.queryByText("Hidden admin content")).not.toBeInTheDocument();
  });

  it("keeps admin navigation around child pages when authenticated", async () => {
    verifyAdminSessionCookieValueMock.mockReturnValue(true);

    render(await AdminLayout({ children: <h2>Child page</h2> }));

    expect(screen.getByRole("navigation", { name: /admin sections/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /waitlist/i })).toHaveAttribute(
      "href",
      "/admin/waitlist",
    );
    expect(screen.getByRole("link", { name: /system indexes/i })).toHaveAttribute(
      "href",
      "/admin/indexes",
    );
    expect(screen.getByRole("link", { name: /test accounts/i })).toHaveAttribute(
      "href",
      "/admin/testers",
    );
    expect(screen.getByRole("heading", { name: "Child page" })).toBeInTheDocument();
  });
});
