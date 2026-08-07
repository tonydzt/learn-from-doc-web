import { describe, expect, it } from "vitest";

import { latestUpdate, productUpdates } from "./updates";

describe("productUpdates", () => {
  it("exposes version 0.3.0 as the latest update without inventing a release date", () => {
    expect(latestUpdate).toEqual(productUpdates[0]);
    expect(latestUpdate.version).toBe("0.3.0");
    expect(latestUpdate.date).toBeUndefined();
    expect(latestUpdate.title).toBe("Accounts, server indexes, and broader docs support");
  });

  it("describes the verified version 0.3.0 additions and improvements", () => {
    expect(latestUpdate.items.Added).toContain(
      "Sign in, sign out, review expired sessions, and refresh account permissions from the optional account area.",
    );
    expect(latestUpdate.items.Improved).toContain(
      "Group indexes by host in the manager and switch between multiple document scopes on the same host.",
    );
    expect(latestUpdate.items.Fixed).toBeUndefined();
  });

  it("keeps earlier releases in version history", () => {
    expect(productUpdates[1].version).toBe("0.2.0");
    expect(productUpdates[2].version).toBe("0.1.0");
    expect(productUpdates[2].items.Added).toContain(
      "Built-in support covers React Docs, Playwright Docs, and OpenAI Codex Docs.",
    );
  });
});
