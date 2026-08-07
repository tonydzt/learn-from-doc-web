import { NextResponse } from "next/server";

import { getCurrentUserPermissions } from "@/lib/permissions";
import { getOrCreateUserProfile } from "@/lib/profiles";
import { createApiSupabaseClient } from "@/lib/supabase/api";

export async function GET(request: Request) {
  const accessToken = bearerTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createApiSupabaseClient(accessToken);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user?.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile, permissions] = await Promise.all([
      getOrCreateUserProfile(supabase, user),
      getCurrentUserPermissions(supabase, user.id),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile.nickname,
      },
      permissions: {
        canSync: permissions.canSync.active,
        canPullServerData: permissions.canPullServerData.active,
        canTestSystemIndexes: permissions.canTestSystemIndexes.active,
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not refresh permissions" }, { status: 500 });
  }
}

function bearerTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || null;
}
