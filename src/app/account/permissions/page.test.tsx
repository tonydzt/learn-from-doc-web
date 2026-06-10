import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountPermissionsPage from "./page";

const {
  redirectMock,
  getUserMock,
  getCurrentUserPermissionsMock,
  getOrCreateUserProfileMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getUserMock: vi.fn(),
  getCurrentUserPermissionsMock: vi.fn(),
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

vi.mock("@/lib/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/permissions")>()),
  getCurrentUserPermissions: getCurrentUserPermissionsMock,
}));

vi.mock("@/lib/profiles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/profiles")>()),
  getOrCreateUserProfile: getOrCreateUserProfileMock,
}));

describe("AccountPermissionsPage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getUserMock.mockReset();
    getCurrentUserPermissionsMock.mockReset();
    getOrCreateUserProfileMock.mockReset();
  });

  it("redirects anonymous visitors to login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await AccountPermissionsPage();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("shows only active permissions in the settings table", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "reader@example.com" } },
    });
    getOrCreateUserProfileMock.mockResolvedValue({
      userId: "user-1",
      nickname: "Reader01",
      avatarInitial: "R",
      avatarBackground: "#174E63",
      avatarColor: "#F9C846",
    });
    getCurrentUserPermissionsMock.mockResolvedValue({
      canSync: { active: true, expiresAt: "2026-07-01T00:00:00.000Z" },
      canPullServerData: { active: false, expiresAt: "2018-01-01T00:00:00.000Z" },
    });

    render(await AccountPermissionsPage());

    expect(screen.getByRole("heading", { name: "Permissions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Permissions", current: "page" })).toHaveAttribute(
      "href",
      "/account/permissions",
    );

    const permissionsTable = screen.getByRole("table", { name: /account permissions/i });
    expect(within(permissionsTable).getByText("Multi-device progress sync")).toBeInTheDocument();
    expect(within(permissionsTable).getByText("Jul 1, 2026")).toBeInTheDocument();
    expect(within(permissionsTable).getByText("Active")).toBeInTheDocument();
    expect(within(permissionsTable).queryByText("Pull server index data")).not.toBeInTheDocument();
    expect(within(permissionsTable).queryByText("Expired")).not.toBeInTheDocument();
    expect(within(permissionsTable).queryByText("Jan 1, 2018")).not.toBeInTheDocument();
  });

  it("shows an empty state when no permissions are active", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "reader@example.com" } },
    });
    getOrCreateUserProfileMock.mockResolvedValue({
      userId: "user-1",
      nickname: "Reader01",
      avatarInitial: "R",
      avatarBackground: "#174E63",
      avatarColor: "#F9C846",
    });
    getCurrentUserPermissionsMock.mockResolvedValue({
      canSync: { active: false, expiresAt: "2018-01-01T00:00:00.000Z" },
      canPullServerData: { active: false, expiresAt: null },
    });

    render(await AccountPermissionsPage());

    expect(screen.getByText("No active permissions")).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /account permissions/i })).not.toBeInTheDocument();
  });
});
