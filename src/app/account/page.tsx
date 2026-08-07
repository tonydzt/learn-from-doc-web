import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountSettingsShell } from "@/app/account/AccountSettingsShell";
import { deleteAccount, saveNickname, signOut } from "@/app/auth/actions";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { product } from "@/content/site";
import { getOrCreateUserProfile, type UserProfile } from "@/lib/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Account | ${product.name}`,
  description: "View your Developer Docs Progress Tracker account.",
};

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPage({ searchParams }: AccountPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const waitingForConfirmation = params.status === "check-email";
  let userEmail: string | undefined;
  let profile: UserProfile | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email;

    if (user) {
      profile = await getOrCreateUserProfile(supabase, user);
    }
  } catch {
    userEmail = undefined;
    profile = undefined;
  }

  if (!userEmail) {
    if (waitingForConfirmation) {
      return (
        <div className="site-shell">
          <SiteHeader />

          <main>
            <section className="account-page wrap" aria-labelledby="account-title">
              <div>
                <p className="eyebrow">Account pending</p>
                <h1 id="account-title">Check your email.</h1>
                <p>
                  The account was created. Open the confirmation link from Supabase to
                  finish verification, then sign in with your email and password.
                </p>
              </div>

              <section className="account-panel" aria-label="Email confirmation pending">
                <span>Status</span>
                <strong>Email confirmation pending</strong>
                <p>
                  Keep this page open while you check your inbox. After confirming the
                  email address, return here through the confirmation link.
                </p>
                <a className="button button--primary" href="/login">
                  Back to sign in
                </a>
              </section>
            </section>
          </main>

          <SiteFooter title="Make long documentation paths readable over time." />
        </div>
      );
    }

    redirect("/login");
  }

  return (
    <AccountSettingsShell activeSection="account" userProfile={profile}>
      <header className="settings-page-header">
        <h2>Account</h2>
        <p>Profile and sign-in details for this Developer Docs Progress Tracker account.</p>
      </header>

      <section className="settings-section" aria-labelledby="account-info-title">
        <div className="settings-section-header">
          <h3 id="account-info-title">Account information</h3>
          <p>No profile fields are collected in this first version.</p>
        </div>

        {profile ? (
          <form className="settings-field-row settings-field-row--form" action={saveNickname}>
            <div className="settings-nickname-line">
              <div>
                <label htmlFor="nickname">Nickname</label>
                <p>Shown in account navigation and future account features.</p>
              </div>
              <input
                id="nickname"
                name="nickname"
                type="text"
                defaultValue={profile.nickname}
                maxLength={32}
                required
              />
            </div>
            <div className="settings-nickname-actions">
              <button className="button button--primary" type="submit">
                Save nickname
              </button>
            </div>
          </form>
        ) : null}

        {profile ? (
          <div className="settings-field-row settings-field-row--profile">
            <div>
              <strong>Avatar</strong>
              <p>Generated from your email initial with account-specific colors.</p>
            </div>
            <div className="profile-avatar-display">
              <span
                aria-label={`${profile.nickname} avatar`}
                className="user-avatar user-avatar--large"
                style={{
                  backgroundColor: profile.avatarBackground,
                  color: profile.avatarColor,
                }}
              >
                {profile.avatarInitial}
              </span>
            </div>
          </div>
        ) : null}

        <div className="settings-field-row">
          <div>
            <strong>Email address</strong>
            <p>Used for sign-in and future account notices.</p>
          </div>
          <span>{userEmail}</span>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="account-access-title">
        <div className="settings-section-header">
          <h3 id="account-access-title">Account access</h3>
          <p>End the current browser session.</p>
        </div>
        <form className="settings-action-row" action={signOut}>
          <button className="button button--primary" type="submit">
            Sign out
          </button>
        </form>
      </section>

      <section className="settings-section settings-section--danger" aria-labelledby="delete-account-title">
        <div className="settings-section-header">
          <h3 id="delete-account-title">Delete account</h3>
          <p>
            Permanently delete this account and remove profile and permission data linked
            to it.
          </p>
        </div>
        <form className="settings-action-row" action={deleteAccount}>
          <button className="button button--danger" type="submit">
            Delete account
          </button>
        </form>
      </section>
    </AccountSettingsShell>
  );
}
