import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminSiteRequestsPage from "./page";

const { listSiteIndexRequestsMock } = vi.hoisted(() => ({
  listSiteIndexRequestsMock: vi.fn(),
}));

vi.mock("@/lib/site-index-requests", () => ({
  listSiteIndexRequests: listSiteIndexRequestsMock,
}));

describe("AdminSiteRequestsPage", () => {
  beforeEach(() => {
    listSiteIndexRequestsMock.mockReset();
  });

  it("shows submitted site index requests", async () => {
    listSiteIndexRequestsMock.mockResolvedValue([
      {
        id: "request-1",
        requestText: "https://vuejs.org/guide/",
        createdAt: "2026-08-10T08:00:00.000Z",
      },
    ]);

    render(await AdminSiteRequestsPage());

    expect(screen.getByRole("heading", { name: /site index requests/i })).toBeInTheDocument();
    expect(screen.getByText("https://vuejs.org/guide/")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
