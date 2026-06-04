export type UpdateCategory = "Added" | "Improved" | "Fixed";

export type ProductUpdate = {
  version: string;
  date: string;
  title: string;
  summary: string;
  items: Partial<Record<UpdateCategory, string[]>> & { Added: string[] };
};

export const productUpdates: [ProductUpdate, ...ProductUpdate[]] = [
  {
    version: "0.2.0",
    date: "2026-06-03",
    title: "Resumable indexing and page-level controls",
    summary:
      "Version 0.2.0 adds recovery paths for interrupted indexing, more precise page progress controls, and smoother support for detected documentation frameworks.",
    items: {
      Added: [
        "Resume interrupted index builds from saved checkpoints when the sidebar links still match.",
        "Pause or resume recording for the current page from a draggable page-level switch.",
        "Delete an individual page's reading record from its progress badge in the documentation sidebar.",
        "Show Subdirectory badges for indexed pages without readable body height.",
        "Choose whether newly indexed pages record progress by default.",
      ],
      Improved: [
        "Cache detected documentation framework support by host and document range.",
        "Continue index creation in the background after optional origin access is granted.",
        "Avoid restarting the reading tracker for hash-only anchor changes on SPA documentation sites.",
        "Export portable data with site settings, page records, and optional global application settings.",
      ],
    },
  },
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
        "Built-in support covers React Docs, Playwright Docs, and OpenAI Codex Docs.",
        "Other HTTPS documentation sites can be checked for supported documentation frameworks including Docusaurus, VitePress, Nextra, Fumadocs, Starlight, Material for MkDocs, and Retype.",
        "Reading data is stored locally in the extension's IndexedDB database, with global settings stored in browser extension local storage.",
      ],
    },
  },
] as const;

export const latestUpdate = productUpdates[0];
