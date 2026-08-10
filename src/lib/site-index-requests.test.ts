import { describe, expect, it } from "vitest";

import { validateSiteIndexRequest } from "./site-index-requests";

describe("validateSiteIndexRequest", () => {
  it("normalizes a valid site request", () => {
    expect(validateSiteIndexRequest({ requestText: "  https://vuejs.org/guide/  " })).toEqual({
      ok: true,
      value: { requestText: "https://vuejs.org/guide/" },
    });
  });

  it("rejects empty and oversized requests", () => {
    expect(validateSiteIndexRequest({ requestText: " " })).toMatchObject({ ok: false });
    expect(validateSiteIndexRequest({ requestText: "a".repeat(501) })).toMatchObject({
      ok: false,
    });
  });
});
