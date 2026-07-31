import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SystemIndexesBrowser } from "./SystemIndexesBrowser";

const indexes = [
  { id: "system-index-1", siteId: "react.dev::learn", host: "react.dev", scopeKey: "learn", scopeTitle: "React Learn", schemaVersion: 1, version: "v1", pageCount: 42, indexedAt: "2026-06-12T08:00:00.000Z", updatedAt: "2026-06-12T08:00:00.000Z", systemStatus: "active" },
  { id: "system-index-2", siteId: "playwright.dev::docs", host: "playwright.dev", scopeKey: "docs", scopeTitle: "Playwright Docs", schemaVersion: 1, version: "v2", pageCount: 3, indexedAt: "2026-06-13T08:00:00.000Z", updatedAt: "2026-06-13T08:00:00.000Z", systemStatus: "inactive" },
];

describe("SystemIndexesBrowser", () => {
  it("uses the same directory and paginated page layout as user indexes", () => {
    const { rerender } = render(<SystemIndexesBrowser host="react" indexes={indexes} page={1} selectedIndexId="" selectedSite="" pages={{ pages: [{ id: "page-1", url: "https://react.dev/learn", title: "Quick Start", order: 0, contentHeight: 1000, updatedAt: "" }], totalCount: 42 }} />);

    expect(screen.getByRole("complementary", { name: /system index directory/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /react learn.*42/i })).toHaveAttribute("href", "/account/indexes?view=system&host=react&site=react.dev&index=system-index-1");
    expect(screen.getByRole("link", { name: /react learn.*42/i, current: "page" })).toBeInTheDocument();
    expect(screen.getByText("Quick Start")).toBeInTheDocument();

    rerender(<SystemIndexesBrowser host="react" indexes={indexes} page={2} selectedIndexId="system-index-1" selectedSite="react.dev" pages={{ pages: [{ id: "page-21", url: "https://react.dev/learn/state", title: "Managing State", order: 20, contentHeight: 1000, updatedAt: "" }], totalCount: 42 }} />);

    expect(screen.getByRole("table", { name: /system index pages/i })).toBeInTheDocument();
    expect(screen.getByText("Managing State")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3 · 20 per page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/account/indexes?view=system&host=react&site=react.dev&index=system-index-1&page=3");
  });
});
