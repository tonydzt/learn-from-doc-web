import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  grantSystemIndexTester,
  listSystemIndexTesters,
  revokeSystemIndexTester,
  systemIndexTesterGrantSource,
} from "./system-index-testers";

const { fromMock, getUserByIdMock, listUsersMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserByIdMock: vi.fn(),
  listUsersMock: vi.fn(),
}));

const supabase = {
  auth: {
    admin: {
      getUserById: getUserByIdMock,
      listUsers: listUsersMock,
    },
  },
  from: fromMock,
};

describe("system index tester management", () => {
  beforeEach(() => {
    fromMock.mockReset();
    getUserByIdMock.mockReset();
    listUsersMock.mockReset();
  });

  it("grants both permanent tester permissions to an existing email", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    listUsersMock.mockResolvedValue({
      data: { users: [{ id: "user-1", email: "Tester@Example.com" }] },
      error: null,
    });
    fromMock.mockReturnValue({ upsert: upsertMock });

    await expect(
      grantSystemIndexTester(supabase as never, " tester@example.com "),
    ).resolves.toEqual({ ok: true, userId: "user-1", email: "Tester@Example.com" });

    expect(upsertMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          user_id: "user-1",
          permission_key: "canPullServerData",
          source: systemIndexTesterGrantSource,
          expires_at: null,
        }),
        expect.objectContaining({
          user_id: "user-1",
          permission_key: "canTestSystemIndexes",
          source: systemIndexTesterGrantSource,
          expires_at: null,
        }),
      ],
      { onConflict: "user_id,permission_key,source" },
    );
  });

  it("does not write grants for an unknown email", async () => {
    listUsersMock.mockResolvedValue({ data: { users: [] }, error: null });

    await expect(
      grantSystemIndexTester(supabase as never, "missing@example.com"),
    ).resolves.toEqual({ ok: false, message: "No account exists for that email address." });

    expect(fromMock).not.toHaveBeenCalled();
  });

  it("lists only manually granted tester accounts", async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [{ user_id: "user-1", starts_at: "2026-06-22T08:00:00.000Z" }],
      error: null,
    });
    const secondEqMock = vi.fn().mockReturnValue({ order: orderMock });
    const firstEqMock = vi.fn().mockReturnValue({ eq: secondEqMock });
    const selectMock = vi.fn().mockReturnValue({ eq: firstEqMock });
    fromMock.mockReturnValue({ select: selectMock });
    getUserByIdMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "tester@example.com" } },
      error: null,
    });

    await expect(listSystemIndexTesters(supabase as never)).resolves.toEqual([
      {
        userId: "user-1",
        email: "tester@example.com",
        grantedAt: "2026-06-22T08:00:00.000Z",
      },
    ]);

    expect(firstEqMock).toHaveBeenCalledWith("permission_key", "canTestSystemIndexes");
    expect(secondEqMock).toHaveBeenCalledWith("source", systemIndexTesterGrantSource);
  });

  it("removes only grants created by tester management", async () => {
    const inMock = vi.fn().mockResolvedValue({ error: null });
    const sourceEqMock = vi.fn().mockReturnValue({ in: inMock });
    const userEqMock = vi.fn().mockReturnValue({ eq: sourceEqMock });
    const deleteMock = vi.fn().mockReturnValue({ eq: userEqMock });
    fromMock.mockReturnValue({ delete: deleteMock });

    await revokeSystemIndexTester(supabase as never, "user-1");

    expect(userEqMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(sourceEqMock).toHaveBeenCalledWith("source", systemIndexTesterGrantSource);
    expect(inMock).toHaveBeenCalledWith("permission_key", [
      "canPullServerData",
      "canTestSystemIndexes",
    ]);
  });
});
