import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  clearCurrentUserIndexProgressAction,
  clearCurrentUserPageProgressAction,
  deleteCurrentUserUploadedIndexAction,
  submitCurrentUserIndexForReviewAction,
  submitCurrentUserSiteForReviewAction,
  unlinkCurrentUserIndexAction,
} from "@/app/account/indexes/actions";
import { AccountSettingsShell } from "@/app/account/AccountSettingsShell";
import { AccountIndexesTabs } from "@/components/AccountIndexesTabs";
import { SystemIndexesBrowser } from "@/components/SystemIndexesBrowser";
import { product } from "@/content/site";
import { listCurrentSystemIndexes, listCurrentSystemIndexPages, listCurrentUserIndexPages, listCurrentUserIndexes } from "@/lib/indexes";
import { getOrCreateUserProfile, type UserProfile } from "@/lib/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Indexes | ${product.name}`,
  description: "Manage synced documentation indexes and reading progress.",
};

export const dynamic = "force-dynamic";

type AccountIndexesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountIndexesPage({ searchParams }: AccountIndexesPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const activeView = firstParam(params.view) === "system" ? "system" : "mine";
  const host = firstParam(params.host)?.trim() ?? "";
  const selectedSite = firstParam(params.site)?.trim() ?? "";
  const selectedIndexId = firstParam(params.index)?.trim() ?? "";
  const page = positiveInteger(firstParam(params.page));
  let userId: string | undefined;
  let profile: UserProfile | undefined;
  let profilePromise: Promise<UserProfile | undefined> = Promise.resolve(undefined);
  const supabase = await createServerSupabaseClient();

  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    const claims = claimsData?.claims;
    userId = typeof claims?.sub === "string" ? claims.sub : undefined;
    if (userId && claims) {
      profilePromise = getOrCreateUserProfile(supabase, {
        id: userId,
        email: typeof claims.email === "string" ? claims.email : undefined,
      });
    }
  } catch {
    userId = undefined;
    profile = undefined;
  }

  if (!userId) {
    return redirect("/login");
  }

  const [loadedProfile, [indexes, systemIndexes]] = await Promise.all([
    profilePromise,
    Promise.all([
      activeView === "mine" ? listCurrentUserIndexes(supabase, userId) : Promise.resolve([]),
      activeView === "system" ? listCurrentSystemIndexes(supabase, { host }) : Promise.resolve([]),
    ]),
  ]);
  profile = loadedProfile;
  const selectedIndex = activeView === "mine"
    ? indexes.find((index) => index.host === selectedSite && index.id === selectedIndexId) ?? indexes[0]
    : undefined;
  const indexPages = selectedIndex
    ? await listCurrentUserIndexPages(supabase, selectedIndex, page, 20)
    : undefined;
  const selectedSystemIndex = activeView === "system"
    ? systemIndexes.find((index) => index.host === selectedSite && index.id === selectedIndexId) ?? systemIndexes[0]
    : undefined;
  const systemIndexPages = selectedSystemIndex
    ? await listCurrentSystemIndexPages(supabase, selectedSystemIndex.id, page, 20)
    : undefined;

  return (
    <AccountSettingsShell activeSection="indexes" contentClassName="account-settings-content--indexes" userProfile={profile}>
      <header className="settings-page-header">
        <h2>Indexes</h2>
        <p>Synced documentation indexes and private reading progress for this account.</p>
      </header>

      <nav className="settings-view-tabs" aria-label="Index management views">
        <Link aria-current={activeView === "mine" ? "page" : undefined} href="/account/indexes">
          Your indexes
        </Link>
        <Link aria-current={activeView === "system" ? "page" : undefined} href="/account/indexes?view=system">
          System indexes
        </Link>
      </nav>

      {activeView === "mine" ? (
        <section className="settings-section" aria-labelledby="user-indexes-title">
          <div className="settings-section-header">
            <h3 id="user-indexes-title">Your indexes</h3>
            <p>Uploaded indexes and system indexes linked to this account.</p>
          </div>
          {indexes.length ? (
            <AccountIndexesTabs
              actions={{
                clearIndexProgress: clearCurrentUserIndexProgressAction,
                clearPageProgress: clearCurrentUserPageProgressAction,
                deleteUploadedIndex: deleteCurrentUserUploadedIndexAction,
                submitForReview: submitCurrentUserIndexForReviewAction,
                submitSiteForReview: submitCurrentUserSiteForReviewAction,
                unlinkIndex: unlinkCurrentUserIndexAction,
              }}
              indexes={indexes}
              page={page}
              pages={indexPages}
              selectedIndexId={selectedIndex?.id ?? selectedIndexId}
              selectedSite={selectedIndex?.host ?? selectedSite}
            />
          ) : (
            <div className="settings-empty-state">
              <strong>No synced indexes</strong>
              <p>Upload an index from the extension to manage it here.</p>
            </div>
          )}
        </section>
      ) : (
        <section className="settings-section" aria-labelledby="system-indexes-title">
          <div className="settings-section-header">
            <div>
              <h3 id="system-indexes-title">System indexes</h3>
              <p>Browse system-level indexes separately from the indexes linked to your account.</p>
            </div>
            <form className="settings-inline-form" action="/account/indexes">
              <input type="hidden" name="view" value="system" />
              <input aria-label="Search system indexes by host" name="host" defaultValue={host} placeholder="react.dev" />
              <button className="button button--primary" type="submit">
                Search
              </button>
            </form>
          </div>
          {systemIndexes.length ? (
            <SystemIndexesBrowser
              host={host}
              indexes={systemIndexes}
              page={page}
              pages={systemIndexPages}
              selectedIndexId={selectedSystemIndex?.id ?? selectedIndexId}
              selectedSite={selectedSystemIndex?.host ?? selectedSite}
            />
          ) : (
            <div className="settings-empty-state">
              <strong>No system indexes</strong>
              <p>{host ? `No system indexes matched "${host}".` : "System indexes will appear here when available."}</p>
            </div>
          )}
        </section>
      )}
    </AccountSettingsShell>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined): number {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 1;
}
