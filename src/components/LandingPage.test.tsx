import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "./LandingPage";
import { storeLinks } from "@/content/site";

describe("LandingPage", () => {
  it("presents the verified reading progress positioning and install actions", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /know where to continue in developer docs/i,
      }),
    ).toBeInTheDocument();

    screen.getAllByRole("link", { name: /add to chrome/i }).forEach((link) => {
      expect(link).toHaveAttribute("href", storeLinks.chrome);
    });
    screen.getAllByRole("link", { name: /get for edge/i }).forEach((link) => {
      expect(link).toHaveAttribute("href", storeLinks.edge);
    });
    screen.getAllByRole("link", { name: /get for firefox/i }).forEach((link) => {
      expect(link).toHaveAttribute("href", storeLinks.firefox);
    });
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
      screen.getByRole("heading", { name: /where is reading progress stored/i }),
    ).toBeInTheDocument();
  });
});
