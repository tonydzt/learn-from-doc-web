import { NextResponse } from "next/server";

import { validateAuthCredentials } from "@/lib/auth";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { getOrCreateUserProfile } from "@/lib/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateAuthCredentials({
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword(validation.value);

    if (error || !data.session?.access_token || !data.user?.id || !data.user.email) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const [profile, permissions] = await Promise.all([
      getOrCreateUserProfile(supabase, data.user),
      getCurrentUserPermissions(supabase, data.user.id),
    ]);

    return NextResponse.json({
      accessToken: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile.nickname,
      },
      permissions: {
        canSync: permissions.canSync.active,
        canPullServerData: permissions.canPullServerData.active,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
}
