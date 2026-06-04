import { describe, expect, it } from "vitest";

import { latestUpdate, productUpdates } from "./updates";

describe("productUpdates", () => {
  it("exposes version 0.2.0 as the latest update", () => {
    expect(latestUpdate).toEqual(productUpdates[0]);
    expect(latestUpdate.version).toBe("0.2.0");
    expect(latestUpdate.title).toBe("Resumable indexing and page-level controls");
  });

  it("describes the version 0.2.0 additions and improvements", () => {
    expect(latestUpdate.items.Added).toContain(
      "Resume interrupted index builds from saved checkpoints when the sidebar links still match.",
    );
    expect(latestUpdate.items.Improved).toContain(
      "Cache detected documentation framework support by host and document range.",
    );
    expect(latestUpdate.items.Fixed).toBeUndefined();
  });

  it("keeps the initial public release in version history", () => {
    expect(productUpdates[1].version).toBe("0.1.0");
    expect(productUpdates[1].items.Added).toContain(
      "Built-in support covers React Docs, Playwright Docs, and OpenAI Codex Docs.",
    );
  });
});
