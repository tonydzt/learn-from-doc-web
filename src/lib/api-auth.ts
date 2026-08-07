import { NextResponse } from "next/server";

import { getCurrentUserPermissions, type UserPermissions } from "./permissions";
import { createApiSupabaseClient } from "./supabase/api";

type PermissionKey = keyof UserPermissions;

export type ApiAuthResult =
  | {
      ok: true;
      userId: string;
      supabase: ReturnType<typeof createApiSupabaseClient>;
    }
  | {
      ok: false;
      response: Response;
    };

export async function requireApiUserPermission(
  request: Request,
  permissionKey: PermissionKey,
): Promise<ApiAuthResult> {
  const accessToken = bearerTokenFromRequest(request);

  if (!accessToken) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const supabase = createApiSupabaseClient(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const permissions = await getCurrentUserPermissions(supabase, user.id);

  if (!permissions[permissionKey].active) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, userId: user.id, supabase };
}

function bearerTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || null;
}
