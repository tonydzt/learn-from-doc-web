import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteAccount } from "./actions";

const { redirectMock, getUserMock, signOutMock, deleteUserMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getUserMock: vi.fn(),
  signOutMock: vi.fn(),
  deleteUserMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: getUserMock,
      signOut: signOutMock,
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: () => ({
    auth: {
      admin: {
        deleteUser: deleteUserMock,
      },
    },
  }),
}));

describe("deleteAccount", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getUserMock.mockReset();
    signOutMock.mockReset();
    deleteUserMock.mockReset();
  });

  it("deletes the signed-in auth user and redirects to login", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    deleteUserMock.mockResolvedValue({ error: null });

    await deleteAccount();

    expect(deleteUserMock).toHaveBeenCalledWith("user-1");
    expect(signOutMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login?message=account-deleted");
  });

  it("redirects anonymous visitors to login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await deleteAccount();

    expect(deleteUserMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
