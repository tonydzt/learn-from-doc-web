import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type SiteIndexRequestInput = {
  requestText: string;
};

type ValidSiteIndexRequestInput = {
  requestText: string;
};

type ValidationResult =
  | { ok: true; value: ValidSiteIndexRequestInput }
  | { ok: false; message: string };

type SiteIndexRequestRow = {
  id: string;
  request_text: string;
  created_at: string;
};

export type SiteIndexRequest = {
  id: string;
  requestText: string;
  createdAt: string;
};

export function validateSiteIndexRequest(input: SiteIndexRequestInput): ValidationResult {
  const requestText = input.requestText.trim();

  if (!requestText) {
    return { ok: false, message: "Enter a site name or documentation URL." };
  }

  if (requestText.length > 500) {
    return { ok: false, message: "Keep the site request under 500 characters." };
  }

  return { ok: true, value: { requestText } };
}

export async function createSiteIndexRequest(input: SiteIndexRequestInput) {
  const validation = validateSiteIndexRequest(input);

  if (!validation.ok) {
    throw new SiteIndexRequestError(validation.message, 400);
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("site_index_requests")
    .insert({
      request_text: validation.value.requestText,
      source: "homepage_supported_docs",
    })
    .select("id,request_text,created_at")
    .single();

  if (error) {
    throw new SiteIndexRequestError(
      "Could not save your request. Please try again.",
      500,
      { cause: error },
    );
  }

  return mapSiteIndexRequest(data as SiteIndexRequestRow);
}

export async function listSiteIndexRequests(): Promise<SiteIndexRequest[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("site_index_requests")
    .select("id,request_text,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new SiteIndexRequestError(
      "Could not load site index requests.",
      500,
      { cause: error },
    );
  }

  return ((data ?? []) as SiteIndexRequestRow[]).map(mapSiteIndexRequest);
}

export class SiteIndexRequestError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

function mapSiteIndexRequest(row: SiteIndexRequestRow): SiteIndexRequest {
  return {
    id: row.id,
    requestText: row.request_text,
    createdAt: row.created_at,
  };
}
