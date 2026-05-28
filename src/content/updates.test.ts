import { describe, expect, it } from "vitest";

import { latestUpdate, productUpdates } from "./updates";

describe("productUpdates", () => {
  it("exposes the initial public release as the latest update", () => {
    expect(latestUpdate).toEqual(productUpdates[0]);
    expect(latestUpdate.version).toBe("0.1.0");
    expect(latestUpdate.title).toBe("Initial public release");
  });

  it("keeps all initial release notes under added features", () => {
    expect(latestUpdate.items.Added).toContain(
      "Create a local documentation index from supported docs sites.",
    );
    expect(latestUpdate.items.Added).toContain(
      "Built-in support covers React Docs, Playwright Docs, and OpenAI Codex Docs.",
    );
    expect(latestUpdate.items.Improved).toBeUndefined();
    expect(latestUpdate.items.Fixed).toBeUndefined();
  });
});
