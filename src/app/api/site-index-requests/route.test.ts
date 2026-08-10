import { beforeEach, describe, expect, it, vi } from "vitest";

import { SiteIndexRequestError } from "@/lib/site-index-requests";
import { POST } from "./route";

const { createSiteIndexRequestMock } = vi.hoisted(() => ({
  createSiteIndexRequestMock: vi.fn(),
}));

vi.mock("@/lib/site-index-requests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/site-index-requests")>()),
  createSiteIndexRequest: createSiteIndexRequestMock,
}));

describe("POST /api/site-index-requests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    createSiteIndexRequestMock.mockReset();
  });

  it("returns 400 for an empty request", async () => {
    const response = await POST(
      new Request("http://localhost/api/site-index-requests", {
        method: "POST",
        body: JSON.stringify({ requestText: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createSiteIndexRequestMock).not.toHaveBeenCalled();
  });

  it("saves a valid site request", async () => {
    createSiteIndexRequestMock.mockResolvedValue({ id: "request-1" });

    const response = await POST(
      new Request("http://localhost/api/site-index-requests", {
        method: "POST",
        body: JSON.stringify({ requestText: "https://vuejs.org/guide/" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(createSiteIndexRequestMock).toHaveBeenCalledWith({
      requestText: "https://vuejs.org/guide/",
    });
  });

  it("logs the server error while returning a safe database failure message", async () => {
    const error = new SiteIndexRequestError(
      "Could not save your request. Please try again.",
      500,
      { cause: { code: "PGRST205", message: "Missing table" } },
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    createSiteIndexRequestMock.mockRejectedValue(error);

    const response = await POST(
      new Request("http://localhost/api/site-index-requests", {
        method: "POST",
        body: JSON.stringify({ requestText: "Vue Docs" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: "Could not save your request. Please try again.",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[site-index-requests] Failed to save request",
      error,
    );
  });
});
