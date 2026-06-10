import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountSettingsShell } from "@/app/account/AccountSettingsShell";
import { product } from "@/content/site";
import {
  getCurrentUserPermissions,
  permissionKeysForDisplay,
  permissionLabels,
  type UserPermissions,
} from "@/lib/permissions";
import { getOrCreateUserProfile, type UserProfile } from "@/lib/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Permissions | ${product.name}`,
  description: "View your Developer Docs Progress Tracker account permissions.",
};

export const dynamic = "force-dynamic";

export default async function AccountPermissionsPage() {
  let userId: string | undefined;
  let userProfile: UserProfile | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userId = user?.id;
    userProfile = user ? await getOrCreateUserProfile(supabase, user) : undefined;
  } catch {
    userId = undefined;
    userProfile = undefined;
  }

  if (!userId) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseClient();
  const permissions = await getCurrentUserPermissions(supabase, userId);

  return (
    <AccountSettingsShell activeSection="permissions" userProfile={userProfile}>
      <header className="settings-page-header">
        <h2>Permissions</h2>
        <p>Feature access attached to your account.</p>
      </header>

      <section className="settings-section" aria-labelledby="permissions-title">
        <div className="settings-section-header">
          <h3 id="permissions-title">Current permissions</h3>
          <p>Only permissions that are currently active are shown here.</p>
        </div>
        <PermissionList permissions={permissions} />
      </section>
    </AccountSettingsShell>
  );
}

function PermissionList({ permissions }: { permissions: UserPermissions }) {
  const labels = permissionLabels();
  const activePermissionKeys = permissionKeysForDisplay().filter(
    (permissionKey) => permissions[permissionKey].active,
  );

  if (activePermissionKeys.length === 0) {
    return (
      <div className="settings-empty-state">
        <strong>No active permissions</strong>
        <p>Expired grants are treated as unavailable.</p>
      </div>
    );
  }

  return (
    <div className="settings-table" role="table" aria-label="Account permissions">
      <div className="settings-table-row settings-table-head" role="row">
        <span role="columnheader">Permission</span>
        <span role="columnheader">Expires</span>
        <span role="columnheader">Status</span>
      </div>
      {activePermissionKeys.map((permissionKey) => {
        const permission = permissions[permissionKey];

        return (
          <div className="settings-table-row" role="row" key={permissionKey}>
            <strong role="cell">{labels[permissionKey]}</strong>
            <span role="cell">{formatExpiry(permission.expiresAt)}</span>
            <span role="cell">
              <span className={permission.active ? "permission-status" : "permission-status expired"}>
                {permission.active ? "Active" : "Expired"}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) {
    return "No grant";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(expiresAt));
}
