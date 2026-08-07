import { describe, expect, it } from "vitest";

import {
  normalizeIndexSnapshot,
  normalizeRawProgress,
  normalizeUploadIndexesRequest,
} from "./index-normalizer";

describe("index normalizers", () => {
  it("normalizes a portable site bundle into stable index fields", () => {
    const normalized = normalizeIndexSnapshot({
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        createdAt: 1,
        updatedAt: 2,
      },
      pages: [
        {
          siteId: "react.dev::learn",
          url: "https://react.dev/learn",
          title: "Quick Start",
          order: 0,
          contentHeight: 1200,
        },
      ],
    });

    expect(normalized).toEqual({
      site: {
        siteId: "react.dev::learn",
        host: "react.dev",
        scopeKey: "learn",
        scopeTitle: "React Learn",
        createdAt: 1,
        updatedAt: 2,
      },
      pages: [
        {
          siteId: "react.dev::learn",
          url: "https://react.dev/learn",
          title: "Quick Start",
          order: 0,
          contentHeight: 1200,
        },
      ],
    });
  });

  it("rejects upload requests with unsupported schema versions", () => {
    const result = normalizeUploadIndexesRequest({
      schemaVersion: 2,
      clientUpdatedAt: 1,
      payload: { schemaVersion: 1, exportedAt: 1, scope: "all", includeProgress: true, sites: [] },
    });

    expect(result.ok).toBe(false);
  });

  it("normalizes raw progress and computes percent from viewed and content height", () => {
    const progress = normalizeRawProgress({
      siteId: "react.dev::learn",
      url: "https://react.dev/learn",
      viewedRanges: [{ start: 0, end: 500 }],
      viewedHeight: 500,
      updatedAt: 10,
    }, 1000);

    expect(progress).toEqual({
      rawProgressVersion: 1,
      rawProgress: {
        siteId: "react.dev::learn",
        url: "https://react.dev/learn",
        viewedRanges: [{ start: 0, end: 500 }],
        viewedHeight: 500,
        updatedAt: 10,
      },
      viewedHeight: 500,
      progressPercent: 50,
    });
  });
});
