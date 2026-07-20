export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type PortablePage = {
  siteId: string;
  url: string;
  title: string;
  order: number;
  contentHeight?: number;
  contentHash?: string;
  structureHash?: string;
};

export type PortableProgress = {
  siteId: string;
  url: string;
  viewedRanges: Array<{ start: number; end: number }>;
  viewedHeight: number;
  updatedAt: number;
};

export type PortableSiteBundle = {
  site: {
    siteId: string;
    host: string;
    scopeKey: string;
    scopeTitle: string;
    createdAt?: number;
    updatedAt?: number;
  };
  pages: PortablePage[];
  siteSettings?: unknown;
  progress?: PortableProgress[];
};

export type PortableData = {
  schemaVersion: 1;
  exportedAt: number;
  scope: "all" | "site";
  includeProgress: boolean;
  appSettings?: unknown;
  sites: PortableSiteBundle[];
};

export type NormalizedIndex = {
  site: PortableSiteBundle["site"];
  pages: PortablePage[];
};

export type NormalizedProgress = {
  rawProgressVersion: 1;
  rawProgress: PortableProgress;
  viewedHeight: number;
  progressPercent: number;
};

export type UploadIndexesRequest = {
  schemaVersion: 1;
  clientUpdatedAt: number;
  payload: PortableData;
};

type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function normalizeUploadIndexesRequest(input: unknown): ValidationResult<UploadIndexesRequest> {
  if (!isRecord(input)) {
    return { ok: false, message: "Request body must be an object." };
  }

  if (input.schemaVersion !== 1) {
    return { ok: false, message: "Unsupported upload schema version." };
  }

  if (typeof input.clientUpdatedAt !== "number") {
    return { ok: false, message: "clientUpdatedAt must be a number." };
  }

  const payload = normalizePortableData(input.payload);

  if (!payload.ok) {
    return payload;
  }

  return {
    ok: true,
    value: {
      schemaVersion: 1,
      clientUpdatedAt: input.clientUpdatedAt,
      payload: payload.value,
    },
  };
}

export function normalizePortableData(input: unknown): ValidationResult<PortableData> {
  if (!isRecord(input)) {
    return { ok: false, message: "payload must be an object." };
  }

  if (input.schemaVersion !== 1) {
    return { ok: false, message: "Unsupported payload schema version." };
  }

  if (!Array.isArray(input.sites)) {
    return { ok: false, message: "payload.sites must be an array." };
  }

  const sites = input.sites.map(normalizePortableSiteBundle);

  return {
    ok: true,
    value: {
      schemaVersion: 1,
      exportedAt: numberOrNow(input.exportedAt),
      scope: input.scope === "site" ? "site" : "all",
      includeProgress: input.includeProgress !== false,
      appSettings: input.appSettings,
      sites,
    },
  };
}

export function normalizeIndexSnapshot(input: unknown): NormalizedIndex {
  const bundle = normalizePortableSiteBundle(input);

  return {
    site: bundle.site,
    pages: bundle.pages,
  };
}

export function normalizeRawProgress(input: unknown, contentHeight?: number): NormalizedProgress {
  const progress = normalizePortableProgress(input);
  const percent =
    typeof contentHeight === "number" && contentHeight > 0
      ? Math.min(100, Math.max(0, (progress.viewedHeight / contentHeight) * 100))
      : 0;

  return {
    rawProgressVersion: 1,
    rawProgress: progress,
    viewedHeight: progress.viewedHeight,
    progressPercent: Math.round(percent * 100) / 100,
  };
}

function normalizePortableSiteBundle(input: unknown): PortableSiteBundle {
  if (!isRecord(input) || !isRecord(input.site)) {
    throw new Error("Invalid site bundle.");
  }

  const siteId = stringValue(input.site.siteId);
  const host = stringValue(input.site.host);
  const scopeKey = stringValue(input.site.scopeKey);
  const scopeTitle = stringValue(input.site.scopeTitle);

  if (!siteId || !host || !scopeKey || !scopeTitle) {
    throw new Error("Site bundle is missing required site fields.");
  }

  const pagesInput = Array.isArray(input.pages) ? input.pages : [];
  const progressInput = Array.isArray(input.progress) ? input.progress : undefined;

  return {
    site: {
      siteId,
      host,
      scopeKey,
      scopeTitle,
      createdAt: optionalNumber(input.site.createdAt),
      updatedAt: optionalNumber(input.site.updatedAt),
    },
    pages: pagesInput.map(normalizePortablePage),
    siteSettings: input.siteSettings,
    progress: progressInput?.map(normalizePortableProgress),
  };
}

function normalizePortablePage(input: unknown): PortablePage {
  if (!isRecord(input)) {
    throw new Error("Invalid page.");
  }

  return {
    siteId: stringValue(input.siteId),
    url: stringValue(input.url),
    title: stringValue(input.title),
    order: numberOrZero(input.order),
    contentHeight: optionalNumber(input.contentHeight),
    contentHash: optionalString(input.contentHash),
    structureHash: optionalString(input.structureHash),
  };
}

function normalizePortableProgress(input: unknown): PortableProgress {
  if (!isRecord(input)) {
    throw new Error("Invalid progress.");
  }

  return {
    siteId: stringValue(input.siteId),
    url: stringValue(input.url),
    viewedRanges: Array.isArray(input.viewedRanges)
      ? input.viewedRanges.filter(isRecord).map((range) => ({
          start: numberOrZero(range.start),
          end: numberOrZero(range.end),
        }))
      : [],
    viewedHeight: numberOrZero(input.viewedHeight),
    updatedAt: numberOrNow(input.updatedAt),
  };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function stringValue(input: unknown): string {
  return typeof input === "string" ? input : "";
}

function optionalString(input: unknown): string | undefined {
  return typeof input === "string" && input ? input : undefined;
}

function numberOrZero(input: unknown): number {
  return typeof input === "number" && Number.isFinite(input) ? input : 0;
}

function numberOrNow(input: unknown): number {
  return typeof input === "number" && Number.isFinite(input) ? input : Date.now();
}

function optionalNumber(input: unknown): number | undefined {
  return typeof input === "number" && Number.isFinite(input) ? input : undefined;
}
