import { describe, expect, it } from "vitest";

import { createMetadata, createRobots, createSitemap } from "./seo";

const siteUrl = "https://docs-progress.example";

describe("SEO output", () => {
  it("builds canonical and social metadata from the configured public URL", () => {
    const metadata = createMetadata(siteUrl);

    expect(metadata.alternates?.canonical).toBe(siteUrl);
    expect(metadata.openGraph?.url).toBe(siteUrl);
    expect(metadata.openGraph?.images).toEqual([
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Developer Docs Progress Tracker",
      },
    ]);
  });

  it("includes Google Search Console site verification metadata", () => {
    expect(createMetadata(siteUrl).verification?.google).toBe(
      "OHhRUmEknnx37dhrMP4cothmsP77u2TNhzuQekHDRQ4",
    );
  });

  it("builds crawl configuration from the same public URL", () => {
    expect(createSitemap(siteUrl)).toEqual([
      expect.objectContaining({ url: siteUrl }),
      expect.objectContaining({ url: `${siteUrl}/updates` }),
    ]);
    expect(createRobots(siteUrl).sitemap).toBe(`${siteUrl}/sitemap.xml`);
  });
});
