import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { contactEmail } from "@/content/site";
import UpdatesPage, { metadata } from "./page";

describe("UpdatesPage", () => {
  it("renders the latest release with grouped update sections", () => {
    render(<UpdatesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /product updates/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /resumable indexing and page-level controls/i }),
    ).toBeInTheDocument();

    const release = screen.getByRole("article", { name: /v0\.2\.0/i });
    expect(within(release).getByText(/2026-06-03/i)).toBeInTheDocument();
    expect(within(release).getByRole("heading", { name: "Added" })).toBeInTheDocument();
    expect(within(release).getByRole("heading", { name: "Improved" })).toBeInTheDocument();
    expect(within(release).queryByRole("heading", { name: "Fixed" })).toBeNull();
    expect(
      within(release).getByText(/resume interrupted index builds/i),
    ).toBeInTheDocument();
  });

  it("keeps the initial public release in version history", () => {
    render(<UpdatesPage />);

    expect(screen.getByRole("article", { name: /v0\.1\.0/i })).toBeInTheDocument();
  });

  it("keeps installation actions available from the updates page", () => {
    render(<UpdatesPage />);

    expect(screen.getAllByRole("link", { name: /add to chrome/i })).not.toHaveLength(0);
  });

  it("links to the contact page from the primary navigation without exposing the email in the footer", () => {
    render(<UpdatesPage />);

    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    const footer = screen.getByRole("contentinfo");

    expect(within(nav).getByRole("link", { name: /contact/i })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(
      within(footer).getByRole("heading", {
        name: /install the latest version from your browser store/i,
      }),
    ).toBeInTheDocument();
    expect(within(footer).queryByText(contactEmail)).toBeNull();
    expect(within(footer).queryByRole("link", { name: /contact/i })).toBeNull();
  });

  it("exports metadata for the updates page", () => {
    expect(metadata.title).toBe("Product updates | Developer Docs Progress Tracker");
    expect(metadata.description).toMatch(/release notes/i);
  });
});
