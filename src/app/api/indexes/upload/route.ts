import { NextResponse } from "next/server";

import { requireApiUserPermission } from "@/lib/api-auth";
import { normalizeUploadIndexesRequest } from "@/lib/index-normalizer";
import { uploadUserIndexes } from "@/lib/indexes";

const maxPayloadBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireApiUserPermission(request, "canSync");

  if (!auth.ok) {
    return auth.response;
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > maxPayloadBytes) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const validation = normalizeUploadIndexesRequest(body);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  try {
    const result = await uploadUserIndexes(auth.supabase, auth.userId, validation.value);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Could not upload indexes", error);
    return NextResponse.json({ error: "Could not upload indexes" }, { status: 500 });
  }
}
