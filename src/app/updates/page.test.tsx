import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import UpdatesPage, { metadata } from "./page";

describe("UpdatesPage", () => {
  it("renders the initial release with grouped update sections", () => {
    render(<UpdatesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /product updates/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /initial public release/i }),
    ).toBeInTheDocument();

    const release = screen.getByRole("article", { name: /v0\.1\.0/i });
    expect(within(release).getByText(/2026-05-28/i)).toBeInTheDocument();
    expect(within(release).getByRole("heading", { name: "Added" })).toBeInTheDocument();
    expect(within(release).queryByRole("heading", { name: "Improved" })).toBeNull();
    expect(within(release).queryByRole("heading", { name: "Fixed" })).toBeNull();
    expect(
      within(release).getByText(/create a local documentation index/i),
    ).toBeInTheDocument();
  });

  it("keeps installation actions available from the updates page", () => {
    render(<UpdatesPage />);

    expect(screen.getAllByRole("link", { name: /add to chrome/i })).not.toHaveLength(0);
  });

  it("exports metadata for the updates page", () => {
    expect(metadata.title).toBe("Product updates | Developer Docs Progress Tracker");
    expect(metadata.description).toMatch(/release notes/i);
  });
});
