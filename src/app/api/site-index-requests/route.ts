import { NextResponse } from "next/server";

import {
  createSiteIndexRequest,
  SiteIndexRequestError,
  validateSiteIndexRequest,
} from "@/lib/site-index-requests";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = { requestText: String(body.requestText ?? "") };
    const validation = validateSiteIndexRequest(input);

    if (!validation.ok) {
      return NextResponse.json(
        { ok: false, message: validation.message },
        { status: 400 },
      );
    }

    await createSiteIndexRequest(validation.value);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[site-index-requests] Failed to save request", error);

    if (error instanceof SiteIndexRequestError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { ok: false, message: "Could not save your request. Please try again." },
      { status: 500 },
    );
  }
}
