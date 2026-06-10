import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountPage from "./page";

const { redirectMock, getUserMock, getOrCreateUserProfileMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getUserMock: vi.fn(),
  getOrCreateUserProfileMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

vi.mock("@/lib/profiles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/profiles")>()),
  getOrCreateUserProfile: getOrCreateUserProfileMock,
}));

describe("AccountPage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getUserMock.mockReset();
    getOrCreateUserProfileMock.mockReset();
  });

  it("redirects anonymous visitors to login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await AccountPage();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("shows a confirmation waiting state after account creation", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    render(await AccountPage({ searchParams: Promise.resolve({ status: "check-email" }) }));

    expect(redirectMock).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument();
    const pendingPanel = screen.getByRole("region", { name: /email confirmation pending/i });

    expect(within(pendingPanel).getByText(/confirmation pending/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows the signed-in account email", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "reader@example.com" } },
    });
    getOrCreateUserProfileMock.mockResolvedValue({
      userId: "user-1",
      nickname: "AbC123xY",
      avatarInitial: "R",
      avatarBackground: "#174E63",
      avatarColor: "#F9C846",
    });

    render(await AccountPage());

    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Account", current: "page" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByRole("link", { name: "Permissions" })).toHaveAttribute(
      "href",
      "/account/permissions",
    );
    expect(screen.getByText("reader@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("AbC123xY")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save nickname/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /regenerate avatar/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("R")).not.toHaveLength(0);
    expect(screen.getByRole("heading", { name: /account information/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });
});
