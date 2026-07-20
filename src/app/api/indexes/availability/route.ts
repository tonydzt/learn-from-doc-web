import { NextResponse } from "next/server";

import { requireApiUserPermission } from "@/lib/api-auth";
import { getIndexAvailability, getPendingReviewIndexAvailability } from "@/lib/indexes";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const siteId = new URL(request.url).searchParams.get("siteId")?.trim();

  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400 });
  }

  const auth = await requireApiUserPermission(request, "canPullServerData");

  if (!auth.ok) {
    if (auth.response.status === 403) {
      return NextResponse.json(
        { error: "Server data pull is not enabled for this account" },
        { status: 403 },
      );
    }

    return auth.response;
  }

  const result = await getIndexAvailability(auth.supabase, auth.userId, siteId);
  const permissions = await getCurrentUserPermissions(auth.supabase, auth.userId);

  if (!permissions.canTestSystemIndexes.active) {
    return NextResponse.json(result);
  }

  const pendingReviewResult = await getPendingReviewIndexAvailability(
    createAdminSupabaseClient(),
    siteId,
  );

  if (result.available && pendingReviewResult.available) {
    return NextResponse.json({
      ...result,
      kinds: [...result.kinds, ...pendingReviewResult.kinds],
    });
  }

  if (pendingReviewResult.available) {
    return NextResponse.json(pendingReviewResult);
  }

  return NextResponse.json(result);
}
