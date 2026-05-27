import { describe, expect, it } from "vitest";

import { getSiteUrl } from "./site";

describe("getSiteUrl", () => {
  it("normalizes a supplied public website URL", () => {
    expect(getSiteUrl("https://docs-progress.example/")).toBe(
      "https://docs-progress.example",
    );
  });

  it("uses the local dev server URL when previewing without a public website URL", () => {
    expect(getSiteUrl(undefined, "development")).toBe("http://localhost:3000");
  });

  it("allows an explicit localhost URL for a development server on another port", () => {
    expect(getSiteUrl("http://localhost:3001/", "development")).toBe(
      "http://localhost:3001",
    );
  });

  it("rejects a missing public website URL for production exports", () => {
    expect(() => getSiteUrl(undefined, "production")).toThrow(
      "SITE_URL is required for production metadata and static exports.",
    );
  });

  it("rejects an HTTP localhost URL for production exports", () => {
    expect(() => getSiteUrl("http://localhost:3001", "production")).toThrow(
      "SITE_URL must be a public HTTPS URL.",
    );
  });
});
