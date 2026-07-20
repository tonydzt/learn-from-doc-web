import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminTestersPage from "./page";

const { listSystemIndexTestersMock } = vi.hoisted(() => ({
  listSystemIndexTestersMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: () => ({ from: vi.fn() }),
}));
vi.mock("@/lib/system-index-testers", () => ({
  listSystemIndexTesters: listSystemIndexTestersMock,
}));

describe("AdminTestersPage", () => {
  beforeEach(() => {
    listSystemIndexTestersMock.mockReset();
    vi.spyOn(window, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the add form and current tester accounts", async () => {
    listSystemIndexTestersMock.mockResolvedValue([
      {
        userId: "user-1",
        email: "tester@example.com",
        grantedAt: "2026-06-22T08:00:00.000Z",
      },
    ]);

    render(await AdminTestersPage());

    expect(screen.getByRole("heading", { name: "System index testers" })).toBeInTheDocument();
    expect(screen.getByLabelText("Account email")).toHaveAttribute("type", "email");
    expect(screen.getByRole("button", { name: "Add tester" })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "System index tester accounts" });
    expect(within(table).getByText("tester@example.com")).toBeInTheDocument();
    expect(within(table).getByRole("button", { name: "Remove tester@example.com" })).toBeInTheDocument();
  });

  it("shows operation feedback from search parameters", async () => {
    listSystemIndexTestersMock.mockResolvedValue([]);

    render(
      await AdminTestersPage({
        searchParams: Promise.resolve({ error: "No account exists for that email address." }),
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No account exists for that email address.");
  });
});
