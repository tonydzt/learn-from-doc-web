import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "./LandingPage";
import { contactEmail, storeLinks } from "@/content/site";

describe("LandingPage", () => {
  it("presents the verified reading progress positioning and install actions", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /keep your place in developer docs/i,
      }),
    ).toBeInTheDocument();

    screen.getAllByRole("link", { name: /add to chrome/i }).forEach((link) => {
      expect(link).toHaveAttribute("href", storeLinks.chrome);
    });
    const edgeLinks = screen.getAllByRole("link", { name: /^edge$/i });
    const firefoxLinks = screen.getAllByRole("link", { name: /^firefox$/i });

    expect(edgeLinks).toHaveLength(1);
    expect(firefoxLinks).toHaveLength(1);
    edgeLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", storeLinks.edge);
    });
    firefoxLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", storeLinks.firefox);
    });
  });

  it("links to product updates and summarizes the latest release", () => {
    render(<LandingPage />);

    expect(screen.getByRole("link", { name: /^updates$/i })).toHaveAttribute(
      "href",
      "/updates",
    );
    expect(
      screen.getByRole("heading", { name: /what's new in v0\.3\.0/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/accounts, server indexes, and broader docs support/i)).toBeInTheDocument();
    expect(
      screen.getByText(/refresh account permissions/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view all updates/i })).toHaveAttribute(
      "href",
      "/updates",
    );
  });

  it("distinguishes built-in support from detectable documentation frameworks", () => {
    render(<LandingPage />);

    const supportedDocs = screen.getByRole("region", {
      name: /built in where you learn/i,
    });
    const builtIn = within(supportedDocs).getByRole("list", { name: /built-in support/i });
    const detectable = within(supportedDocs).getByRole("list", {
      name: /detectable documentation frameworks/i,
    });

    expect(within(builtIn).getByText("React Docs")).toBeInTheDocument();
    expect(within(builtIn).getByText("Playwright Docs")).toBeInTheDocument();
    expect(within(builtIn).getByText("OpenAI Codex Docs")).toBeInTheDocument();
    expect(within(detectable).getByText("Docusaurus")).toBeInTheDocument();
    expect(within(detectable).getByText("Retype")).toBeInTheDocument();
  });

  it("surfaces local data facts and crawlable factual questions", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: /your reading data stays local/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/local indexeddb database/i)).not.toHaveLength(0);
    expect(
      screen.getByRole("heading", { name: /what progress does the extension track/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /can indexing resume after it stops/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /can i pause or remove page progress/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /where is reading progress stored/i }),
    ).toBeInTheDocument();
  });

  it("links to the contact page from the primary navigation without exposing the email in the footer", () => {
    render(<LandingPage />);

    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    const footer = screen.getByRole("contentinfo");

    expect(within(nav).getByRole("link", { name: /contact/i })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(
      within(footer).getByRole("heading", {
        name: /make long documentation paths readable over time/i,
      }),
    ).toBeInTheDocument();
    expect(within(footer).queryByRole("link", { name: /add to chrome/i })).toBeNull();
    expect(within(footer).queryByRole("link", { name: /^edge$/i })).toBeNull();
    expect(within(footer).queryByRole("link", { name: /^firefox$/i })).toBeNull();
    expect(within(footer).queryByText(contactEmail)).toBeNull();
    expect(within(footer).queryByRole("link", { name: /contact/i })).toBeNull();
  });

  it("lets visitors reserve future features with their email and selected interests", () => {
    render(<LandingPage />);

    const waitlist = screen.getByRole("region", { name: /reserve future features/i });

    expect(
      within(waitlist).getByRole("heading", { name: /reserve the next layer/i }),
    ).toBeInTheDocument();
    expect(
      within(waitlist).getByRole("checkbox", { name: /user registration and login/i }),
    ).toBeInTheDocument();
    expect(
      within(waitlist).getByRole("checkbox", { name: /personal progress dashboard/i }),
    ).toBeInTheDocument();
    expect(
      within(waitlist).getByRole("checkbox", { name: /cross-device progress sync/i }),
    ).toBeInTheDocument();

    fireEvent.click(within(waitlist).getByRole("checkbox", { name: /user registration/i }));
    fireEvent.change(within(waitlist).getByLabelText(/email address/i), {
      target: { value: "reader@example.com" },
    });

    expect(within(waitlist).getByRole("button", { name: /reserve updates/i })).toBeEnabled();
  });
});
