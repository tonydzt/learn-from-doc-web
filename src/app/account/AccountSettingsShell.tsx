import Link from "next/link";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/SiteHeader";

type AccountSettingsShellProps = {
  activeSection: "account" | "permissions" | "indexes";
  children: ReactNode;
  userProfile?: {
    nickname: string;
    avatarInitial: string;
    avatarBackground: string;
    avatarColor: string;
  };
};

const accountNavItems = [
  {
    id: "account",
    label: "Account",
    href: "/account",
  },
  {
    id: "permissions",
    label: "Permissions",
    href: "/account/permissions",
  },
  {
    id: "indexes",
    label: "Indexes",
    href: "/account/indexes",
  },
] as const;

export function AccountSettingsShell({
  activeSection,
  children,
  userProfile,
}: AccountSettingsShellProps) {
  return (
    <div className="site-shell account-settings-shell">
      <SiteHeader signedIn userProfile={userProfile} />

      <main className="account-settings">
        <aside className="account-settings-sidebar" aria-label="Account sections">
          <h1>Settings</h1>
          <nav aria-label="Account settings">
            <span>Account</span>
            {accountNavItems.map((item) => (
              <Link
                aria-current={activeSection === item.id ? "page" : undefined}
                className={activeSection === item.id ? "active" : undefined}
                href={item.href}
                key={item.id}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="account-settings-content">{children}</section>
      </main>
    </div>
  );
}
