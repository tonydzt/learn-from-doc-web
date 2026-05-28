import type { Metadata } from "next";

import { contactEmail, product } from "@/content/site";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: `Contact | ${product.name}`,
  description:
    "Contact support for Developer Docs Progress Tracker with questions, feedback, or extension support requests.",
};

export default function ContactPage() {
  return (
    <div className="site-shell">
      <SiteHeader />

      <main>
        <section className="contact-hero wrap" aria-labelledby="contact-title">
          <p className="eyebrow">Contact</p>
          <h1 id="contact-title">Contact Developer Docs Progress Tracker.</h1>
          <p>
            Send questions, feedback, or extension support requests by email. Include
            your browser, extension version, and the documentation site if the request
            is about a specific page.
          </p>
          <div className="contact-actions">
            <a className="button button--primary" href={`mailto:${contactEmail}`}>
              Email support
              <span aria-hidden="true">+</span>
            </a>
            <span>{contactEmail}</span>
          </div>
        </section>
      </main>

      <SiteFooter title="Make long documentation paths readable over time." />
    </div>
  );
}
