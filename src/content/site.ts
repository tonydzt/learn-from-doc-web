export const product = {
  name: "Developer Docs Progress Tracker",
  description:
    "Track visible reading progress across developer documentation pages with a local index, resumable indexing, page badges, and per-page recording controls.",
  heroTitle: "Keep your place in developer docs.",
} as const;

export const storeLinks = {
  chrome:
    "https://chromewebstore.google.com/detail/developer-docs-progress-t/kolmdkfelfdjlohnoecmfplpppcogjoj",
  edge: "https://microsoftedge.microsoft.com/addons/detail/gfepcknhjodmnakhbgdnebncolgclgad",
  firefox:
    "https://addons.mozilla.org/en-US/firefox/addon/developer-doc-progress-tracker",
} as const;

export const contactEmail = "douzhitong0215@gmail.com";

export const howItWorks = [
  {
    marker: "01",
    title: "Build or resume an index",
    description:
      "Open the extension on a supported documentation site to collect its pages, measure body content, and resume an interrupted index when a checkpoint is available.",
  },
  {
    marker: "02",
    title: "Track what you see",
    description:
      "Progress is calculated from the body content that enters your viewport, not simply from pages you visited.",
  },
  {
    marker: "03",
    title: "Control progress per page",
    description:
      "See total progress, page badges, a right-side reading map, and a draggable page recording switch while moving through long technical guides.",
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
    question: "Can indexing resume after it stops?",
    answer:
      "Yes. Indexing saves temporary checkpoints during measurement, and the popup can offer a resume action when the previous sidebar links still match the current documentation range.",
  },
  {
    question: "Which documentation sites are supported?",
    answer:
      "React Docs, Playwright Docs, and OpenAI Codex Docs have built-in support. Other HTTPS documentation sites can be checked for detectable frameworks such as Docusaurus, VitePress, Nextra, Fumadocs, Starlight, Material for MkDocs, and Retype; detected support is cached for that host and document range.",
  },
  {
    question: "Can I pause or remove page progress?",
    answer:
      "Yes. Indexed pages can use a page-level recording switch, and page progress badges with existing records support deletion from the documentation sidebar.",
  },
  {
    question: "Where is reading progress stored?",
    answer:
      "Site indexes, reading progress, page settings, site settings, and index checkpoints are stored in a local IndexedDB database in the extension. Global extension settings are stored through browser extension local storage.",
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
