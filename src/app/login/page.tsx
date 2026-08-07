import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/LoginForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { product } from "@/content/site";

export const metadata: Metadata = {
  title: `Sign in | ${product.name}`,
  description: "Sign in to Developer Docs Progress Tracker with email and password.",
};

export default function LoginPage() {
  return (
    <div className="site-shell">
      <SiteHeader />

      <main>
        <section className="auth-page wrap" aria-labelledby="login-title">
          <div className="auth-copy">
            <p className="eyebrow">Account access</p>
            <h1 id="login-title">Sign in.</h1>
            <p>
              Use the email and password from registration. If the email confirmation
              link has not been opened yet, the account remains locked.
            </p>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </section>
      </main>

      <SiteFooter title="Make long documentation paths readable over time." />
    </div>
  );
}
