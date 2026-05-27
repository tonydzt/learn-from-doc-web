export const product = {
  name: "Developer Docs Progress Tracker",
  description:
    "Track visible reading progress across developer documentation pages with a local index, page badges, and an optional reading map.",
  heroTitle: "Know where to continue in developer docs.",
} as const;

export const storeLinks = {
  chrome:
    "https://chromewebstore.google.com/detail/developer-docs-progress-t/kolmdkfelfdjlohnoecmfplpppcogjoj",
  edge: "https://microsoftedge.microsoft.com/addons/detail/gfepcknhjodmnakhbgdnebncolgclgad",
  firefox:
    "https://addons.mozilla.org/en-US/firefox/addon/developer-doc-progress-tracker",
} as const;

export const howItWorks = [
  {
    marker: "01",
    title: "Create a local index",
    description:
      "Open the extension on a supported documentation site to collect its pages and establish a progress index.",
  },
  {
    marker: "02",
    title: "Track what you see",
    description:
      "Progress is calculated from the body content that enters your viewport, not simply from pages you visited.",
  },
  {
    marker: "03",
    title: "Read on with context",
    description:
      "See total progress, page badges, and a right-side reading map while moving through long technical guides.",
  },
] as const;

export const builtInDocs = ["React Docs", "Playwright Docs", "OpenAI Codex Docs"] as const;

export const detectableFrameworks = [
  "Docusaurus",
  "VitePress",
  "Nextra",
  "Fumadocs",
  "Starlight",
  "Material for MkDocs",
  "Retype",
] as const;

export const faqs = [
  {
    question: "What progress does the extension track?",
    answer:
      "It records the visible height ranges of documentation body content as you read and uses those ranges to calculate per-page and total document progress.",
  },
  {
    question: "Which documentation sites are supported?",
    answer:
      "React Docs, Playwright Docs, and OpenAI Codex Docs have built-in support. Other HTTPS documentation sites can be checked for detectable frameworks such as Docusaurus, VitePress, Nextra, Fumadocs, Starlight, Material for MkDocs, and Retype.",
  },
  {
    question: "Where is reading progress stored?",
    answer:
      "Site indexes and reading progress are stored in a local IndexedDB database in the extension. Global extension settings are stored through the browser extension's local storage.",
  },
  {
    question: "Which browsers can install the extension?",
    answer:
      "Developer Docs Progress Tracker has published installation pages for Chrome, Microsoft Edge, and Firefox.",
  },
] as const;

export function getSiteUrl(
  value = process.env.SITE_URL,
  environment = process.env.NODE_ENV,
): string {
  if (!value) {
    if (environment !== "production") {
      return "http://localhost:3000";
    }

    throw new Error("SITE_URL is required for production metadata and static exports.");
  }

  const url = new URL(value);
  const isLocalDevelopmentUrl =
    environment !== "production" &&
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");

  if (url.protocol !== "https:" && !isLocalDevelopmentUrl) {
    throw new Error("SITE_URL must be a public HTTPS URL.");
  }

  return url.toString().replace(/\/$/, "");
}
