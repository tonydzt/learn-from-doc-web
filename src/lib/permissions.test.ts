import { describe, expect, it } from "vitest";

import { resolveUserPermissions } from "./permissions";

const now = new Date("2026-06-09T00:00:00.000Z");

describe("resolveUserPermissions", () => {
  it("marks active grants as active", () => {
    const permissions = resolveUserPermissions(
      [
        {
          permission_key: "canSync",
          starts_at: "2026-01-01T00:00:00.000Z",
          expires_at: "2026-07-01T00:00:00.000Z",
        },
      ],
      now,
    );

    expect(permissions.canSync).toEqual({
      active: true,
      expiresAt: "2026-07-01T00:00:00.000Z",
    });
  });

  it("marks expired grants as inactive", () => {
    const permissions = resolveUserPermissions(
      [
        {
          permission_key: "canPullServerData",
          starts_at: "2017-10-01T00:00:00.000Z",
          expires_at: "2018-01-01T00:00:00.000Z",
        },
      ],
      now,
    );

    expect(permissions.canPullServerData).toEqual({
      active: false,
      expiresAt: "2018-01-01T00:00:00.000Z",
    });
  });

  it("returns inactive missing permissions without an expiry", () => {
    const permissions = resolveUserPermissions([], now);

    expect(permissions.canSync).toEqual({ active: false, expiresAt: null });
    expect(permissions.canPullServerData).toEqual({ active: false, expiresAt: null });
  });

  it("uses an active grant before a later inactive expiry", () => {
    const permissions = resolveUserPermissions(
      [
        {
          permission_key: "canSync",
          starts_at: "2027-01-01T00:00:00.000Z",
          expires_at: "2027-04-01T00:00:00.000Z",
        },
        {
          permission_key: "canSync",
          starts_at: "2026-01-01T00:00:00.000Z",
          expires_at: "2026-07-01T00:00:00.000Z",
        },
      ],
      now,
    );

    expect(permissions.canSync).toEqual({
      active: true,
      expiresAt: "2026-07-01T00:00:00.000Z",
    });
  });
});
