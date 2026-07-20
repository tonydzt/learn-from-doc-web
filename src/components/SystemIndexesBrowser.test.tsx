import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SystemIndexesBrowser } from "./SystemIndexesBrowser";

const indexes = [
  {
    id: "system-index-1",
    siteId: "react.dev::learn",
    host: "react.dev",
    scopeKey: "learn",
    scopeTitle: "React Learn",
    schemaVersion: 1,
    version: "v1",
    pageCount: 1,
    indexedAt: "2026-06-12T08:00:00.000Z",
    updatedAt: "2026-06-12T08:00:00.000Z",
    systemStatus: "active",
    pages: [
      {
        id: "page-1",
        url: "https://react.dev/learn",
        title: "Quick Start",
        order: 0,
        contentHeight: 1000,
        updatedAt: "2026-06-12T08:00:00.000Z",
      },
    ],
  },
  {
    id: "system-index-2",
    siteId: "playwright.dev::docs",
    host: "playwright.dev",
    scopeKey: "docs",
    scopeTitle: "Playwright Docs",
    schemaVersion: 1,
    version: "v2",
    pageCount: 1,
    indexedAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    systemStatus: "inactive",
    pages: [
      {
        id: "page-2",
        url: "https://playwright.dev/docs/intro",
        title: "Installation Intro",
        order: 0,
        contentHeight: 2000,
        updatedAt: "2026-06-13T08:00:00.000Z",
      },
    ],
  },
  {
    id: "system-index-3",
    siteId: "react.dev::reference",
    host: "react.dev",
    scopeKey: "reference",
    scopeTitle: "React Reference",
    schemaVersion: 1,
    version: "v3",
    pageCount: 1,
    indexedAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
    systemStatus: "active",
    pages: [
      {
        id: "page-3",
        url: "https://react.dev/reference/react",
        title: "React APIs",
        order: 0,
        contentHeight: 1800,
        updatedAt: "2026-06-14T08:00:00.000Z",
      },
    ],
  },
];

describe("SystemIndexesBrowser", () => {
  it("shows a compact system index list and switches one detail at a time", () => {
    render(<SystemIndexesBrowser indexes={indexes} />);

    expect(screen.getByRole("heading", { name: "react.dev" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "playwright.dev" })).toBeInTheDocument();
    const reactTable = screen.getByRole("table", { name: /directory trees for react.dev/i });
    expect(reactTable).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /directory trees for playwright.dev/i })).toBeInTheDocument();
    expect(within(reactTable).getByRole("columnheader", { name: /directory tree/i })).toBeInTheDocument();
    expect(within(reactTable).getByRole("columnheader", { name: /host/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /react learn/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /react reference/i })).toHaveAttribute("aria-pressed", "false");
    expect(within(screen.getByRole("article", { name: /selected system index detail/i })).getByText("Active system index")).toBeInTheDocument();
    expect(screen.getByText("Quick Start")).toBeInTheDocument();
    expect(screen.queryByText("Installation Intro")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /playwright docs/i }));

    expect(screen.getByRole("button", { name: /react learn/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /playwright docs/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(screen.getByRole("article", { name: /selected system index detail/i })).getByText("Inactive system index")).toBeInTheDocument();
    expect(screen.queryByText("Quick Start")).not.toBeInTheDocument();
    expect(screen.getByText("Installation Intro")).toBeInTheDocument();
    expect(screen.getByText("https://playwright.dev/docs/intro")).toBeInTheDocument();
  });
});
