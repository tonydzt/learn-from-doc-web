import { NextResponse } from "next/server";

import { requireApiUserPermission } from "@/lib/api-auth";
import { pullUserIndexes } from "@/lib/indexes";

export async function GET(request: Request) {
  const auth = await requireApiUserPermission(request, "canPullServerData");

  if (!auth.ok) {
    return auth.response;
  }

  const result = await pullUserIndexes(auth.supabase, auth.userId);

  return NextResponse.json(result);
}
