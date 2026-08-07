import { describe, expect, it, vi } from "vitest";

import { createDefaultUserProfile, generateAvatarStyle, generateNickname } from "./profiles";

describe("profile defaults", () => {
  it("generates an 8 character alphanumeric nickname", () => {
    const nickname = generateNickname();

    expect(nickname).toHaveLength(8);
    expect(nickname).toMatch(/^[A-Za-z0-9]{8}$/);
  });

  it("uses the uppercase email initial for the default avatar", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(createDefaultUserProfile("user-1", "reader@example.com")).toMatchObject({
      userId: "user-1",
      avatarInitial: "R",
    });

    vi.restoreAllMocks();
  });

  it("generates a complete avatar style", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(generateAvatarStyle("reader@example.com")).toEqual({
      avatarInitial: "R",
      avatarBackground: "#174E63",
      avatarColor: "#F9C846",
    });

    vi.restoreAllMocks();
  });
});
