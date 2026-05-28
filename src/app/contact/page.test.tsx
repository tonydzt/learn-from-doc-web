import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { contactEmail, storeLinks } from "@/content/site";
import ContactPage, { metadata } from "./page";

describe("ContactPage", () => {
  it("renders a focused contact page with an email action", () => {
    render(<ContactPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /contact developer docs progress tracker/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /email support/i })).toHaveAttribute(
      "href",
      `mailto:${contactEmail}`,
    );
    expect(screen.getByText(contactEmail)).toBeInTheDocument();
    expect(
      screen
        .getByRole("navigation", { name: /primary navigation/i })
        .querySelector('a[href="/contact"]'),
    ).not.toBeNull();
    expect(screen.getAllByRole("link", { name: /add to chrome/i })[0]).toHaveAttribute(
      "href",
      storeLinks.chrome,
    );
  });

  it("exports metadata for the contact page", () => {
    expect(metadata.title).toBe("Contact | Developer Docs Progress Tracker");
    expect(metadata.description).toMatch(/support/i);
  });
});
