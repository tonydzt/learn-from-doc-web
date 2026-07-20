import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { loginAdmin } from "@/app/admin/actions";
import {
  verifyAdminSessionCookieValue,
  waitlistAdminCookieName,
} from "@/lib/waitlistAdminAuth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies();
  const authenticated = verifyAdminSessionCookieValue(
    cookieStore.get(waitlistAdminCookieName)?.value,
  );

  if (!authenticated) {
    return (
      <main className="admin-page wrap">
        <div className="admin-heading">
          <p className="eyebrow">Private operations</p>
          <h1>Admin</h1>
        </div>
        <form className="admin-panel admin-login" action={loginAdmin}>
          <input type="hidden" name="returnPath" value="/admin" />
          <label htmlFor="admin-password">Admin password</label>
          <div>
            <input id="admin-password" name="password" type="password" required />
            <button className="button button--primary" type="submit">
              Sign in
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-console-sidebar">
        <h1>Admin</h1>
        <span>Directory</span>
        <nav aria-label="Admin sections">
          <Link href="/admin/waitlist">
            <strong>Waitlist</strong>
            <small>Reservations and notices</small>
          </Link>
          <Link href="/admin/indexes">
            <strong>System indexes</strong>
            <small>Index snapshots and pages</small>
          </Link>
          <Link href="/admin/testers">
            <strong>Test accounts</strong>
            <small>Pending index access</small>
          </Link>
        </nav>
      </aside>
      <section className="admin-shell-content">{children}</section>
    </main>
  );
}
