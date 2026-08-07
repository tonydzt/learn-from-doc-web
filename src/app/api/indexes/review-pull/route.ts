import { NextResponse } from "next/server";

import { requireApiUserPermission } from "@/lib/api-auth";
import { pullPendingReviewIndex } from "@/lib/indexes";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const siteId = new URL(request.url).searchParams.get("siteId")?.trim();

  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400 });
  }

  const auth = await requireApiUserPermission(request, "canPullServerData");

  if (!auth.ok) {
    return auth.response;
  }

  const permissions = await getCurrentUserPermissions(auth.supabase, auth.userId);

  if (!permissions.canTestSystemIndexes.active) {
    return NextResponse.json(
      { error: "System index testing is not enabled for this account" },
      { status: 403 },
    );
  }

  const result = await pullPendingReviewIndex(createAdminSupabaseClient(), siteId);

  return NextResponse.json(result);
}
