export type UpdateCategory = "Added" | "Improved" | "Fixed";

export type ProductUpdate = {
  version: string;
  date: string;
  title: string;
  summary: string;
  items: Record<UpdateCategory, string[]>;
};

export const productUpdates = [
  {
    version: "0.1.0",
    date: "2026-05-28",
    title: "Initial public release",
    summary:
      "Developer Docs Progress Tracker is now available for tracking visible reading progress across supported developer documentation sites with local-first storage.",
    items: {
      Added: [
        "Create a local documentation index from supported docs sites.",
        "Track reading progress from visible body content, not just visited pages.",
        "Show document progress, page badges, and an optional right-side reading map while reading.",
        "Manage indexed sites, site progress, import, export, and settings from the extension manager page.",
        "Install from Chrome, Microsoft Edge, and Firefox extension stores.",
      ],
      Improved: [
        "Built-in support covers React Docs, Playwright Docs, and OpenAI Codex Docs.",
        "Other HTTPS documentation sites can be checked for supported documentation frameworks including Docusaurus, VitePress, Nextra, Fumadocs, Starlight, Material for MkDocs, and Retype.",
        "Reading data is stored locally in the extension's IndexedDB database, with global settings stored in browser extension local storage.",
      ],
      Fixed: ["No separate fixes are listed for the initial public release."],
    },
  },
] as const satisfies ProductUpdate[];

export const latestUpdate = productUpdates[0];
