import type { createAdminSupabaseClient } from "./supabase/admin";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

type TesterGrantRow = {
  user_id: string;
  starts_at: string;
};

export type SystemIndexTester = {
  userId: string;
  email: string;
  grantedAt: string;
};

export type GrantSystemIndexTesterResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; message: string };

export const systemIndexTesterGrantSource = "admin_system_index_tester";

const testerPermissionKeys = ["canPullServerData", "canTestSystemIndexes"] as const;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listSystemIndexTesters(
  supabase: AdminClient,
): Promise<SystemIndexTester[]> {
  const { data, error } = await supabase
    .from("user_permission_grants")
    .select("user_id, starts_at")
    .eq("permission_key", "canTestSystemIndexes")
    .eq("source", systemIndexTesterGrantSource)
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error("Could not load system index testers.");
  }

  const testers = await Promise.all(
    ((data ?? []) as TesterGrantRow[]).map(async (grant) => {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        grant.user_id,
      );

      if (userError || !userData.user?.email) {
        return null;
      }

      return {
        userId: grant.user_id,
        email: userData.user.email,
        grantedAt: grant.starts_at,
      };
    }),
  );

  return testers.filter((tester): tester is SystemIndexTester => tester !== null);
}

export async function grantSystemIndexTester(
  supabase: AdminClient,
  inputEmail: string,
): Promise<GrantSystemIndexTesterResult> {
  const email = inputEmail.trim().toLowerCase();

  if (!emailPattern.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const user = await findUserByEmail(supabase, email);

  if (!user?.email) {
    return { ok: false, message: "No account exists for that email address." };
  }

  const startsAt = new Date().toISOString();
  const { error } = await supabase.from("user_permission_grants").upsert(
    testerPermissionKeys.map((permissionKey) => ({
      user_id: user.id,
      permission_key: permissionKey,
      source: systemIndexTesterGrantSource,
      starts_at: startsAt,
      expires_at: null,
    })),
    { onConflict: "user_id,permission_key,source" },
  );

  if (error) {
    throw new Error("Could not grant system index tester access.");
  }

  return { ok: true, userId: user.id, email: user.email };
}

export async function revokeSystemIndexTester(
  supabase: AdminClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_permission_grants")
    .delete()
    .eq("user_id", userId)
    .eq("source", systemIndexTesterGrantSource)
    .in("permission_key", [...testerPermissionKeys]);

  if (error) {
    throw new Error("Could not revoke system index tester access.");
  }
}

async function findUserByEmail(supabase: AdminClient, email: string) {
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error("Could not find account.");
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }
  }
}
