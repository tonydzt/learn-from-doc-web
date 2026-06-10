import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SignupForm } from "@/components/SignupForm";
import { product } from "@/content/site";

export const metadata: Metadata = {
  title: `Create account | ${product.name}`,
  description:
    "Create a Developer Docs Progress Tracker account with email confirmation.",
};

export default function SignupPage() {
  return (
    <div className="site-shell">
      <SiteHeader />

      <main>
        <section className="auth-page wrap" aria-labelledby="signup-title">
          <div className="auth-copy">
            <p className="eyebrow">Account access</p>
            <h1 id="signup-title">Create your account.</h1>
            <p>
              Start with an email-confirmed account for future dashboard and sync
              features. The confirmation link must be opened before password login works.
            </p>
          </div>
          <SignupForm />
        </section>
      </main>

      <SiteFooter title="Make long documentation paths readable over time." />
    </div>
  );
}
