import type { createServerSupabaseClient } from "./supabase/server";

export type PermissionStatus = {
  active: boolean;
  expiresAt: string | null;
};

export type UserPermissions = {
  canSync: PermissionStatus;
  canPullServerData: PermissionStatus;
  canTestSystemIndexes: PermissionStatus;
};

export type PermissionGrantRow = {
  permission_key: string;
  starts_at: string;
  expires_at: string | null;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type PermissionKey = keyof UserPermissions;

const permissionKeys: PermissionKey[] = ["canSync", "canPullServerData", "canTestSystemIndexes"];

const inactivePermission: PermissionStatus = {
  active: false,
  expiresAt: null,
};

export async function getCurrentUserPermissions(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<UserPermissions> {
  const { data, error } = await supabase
    .from("user_permission_grants")
    .select("permission_key, starts_at, expires_at")
    .eq("user_id", userId);

  if (error || !data) {
    return resolveUserPermissions([]);
  }

  return resolveUserPermissions(data);
}

export function resolveUserPermissions(
  grants: PermissionGrantRow[],
  now: Date = new Date(),
): UserPermissions {
  return {
    canSync: resolvePermission("canSync", grants, now),
    canPullServerData: resolvePermission("canPullServerData", grants, now),
    canTestSystemIndexes: resolvePermission("canTestSystemIndexes", grants, now),
  };
}

function resolvePermission(
  permissionKey: PermissionKey,
  grants: PermissionGrantRow[],
  now: Date,
): PermissionStatus {
  const matchingGrants = grants.filter((grant) => grant.permission_key === permissionKey);

  if (matchingGrants.length === 0) {
    return { ...inactivePermission };
  }

  const activeGrants = matchingGrants.filter((grant) => {
    const startsAt = new Date(grant.starts_at);

    return startsAt <= now && (grant.expires_at === null || new Date(grant.expires_at) > now);
  });

  const grant = latestExpiryGrant(activeGrants.length > 0 ? activeGrants : matchingGrants);

  return {
    active: activeGrants.length > 0,
    expiresAt: grant?.expires_at ?? null,
  };
}

function latestExpiryGrant(grants: PermissionGrantRow[]): PermissionGrantRow | undefined {
  return grants.reduce<PermissionGrantRow | undefined>((latestGrant, grant) => {
    if (!latestGrant) {
      return grant;
    }

    if (latestGrant.expires_at === null) {
      return latestGrant;
    }

    if (grant.expires_at === null) {
      return grant;
    }

    return new Date(grant.expires_at) > new Date(latestGrant.expires_at) ? grant : latestGrant;
  }, undefined);
}

export function permissionLabels(): Record<PermissionKey, string> {
  return {
    canSync: "Multi-device progress sync",
    canPullServerData: "Pull server index data",
    canTestSystemIndexes: "Test pending system indexes",
  };
}

export function permissionKeysForDisplay(): PermissionKey[] {
  return [...permissionKeys];
}
