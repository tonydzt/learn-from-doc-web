import Image from "next/image";
import Link from "next/link";

import {
  builtInDocs,
  detectableFrameworks,
  faqs,
  howItWorks,
  product,
} from "@/content/site";
import { latestUpdate } from "@/content/updates";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SiteIndexRequestForm } from "./SiteIndexRequestForm";
import { StoreActions } from "./StoreActions";

type LandingPageProps = {
  signedIn?: boolean;
  userProfile?: {
    nickname: string;
    avatarInitial: string;
    avatarBackground: string;
    avatarColor: string;
  };
};

export function LandingPage({ signedIn = false, userProfile }: LandingPageProps) {
  return (
    <div className="site-shell">
      <SiteHeader homeAnchors signedIn={signedIn} userProfile={userProfile} />

      <main>
        <section className="hero wrap" aria-label="Introduction">
          <div className="hero-copy reveal">
            <p className="eyebrow">A reading ledger for developer documentation</p>
            <h1>{product.heroTitle}</h1>
            <p className="hero-text">
              Track the technical pages you have actually seen. Build or resume a
              local index, reveal visible progress, and decide when each page should
              keep recording.
            </p>
            <StoreActions />
            <p className="microcopy">
              Published for Chrome, Edge, and Firefox. Reading progress is stored
              locally by the extension.
            </p>
          </div>

          <div className="hero-art reveal reveal--late">
            <div className="ledger-note">
              <span>Reading path</span>
              <strong>React Compiler</strong>
              <small>Visible progress in context</small>
            </div>
            <figure className="browser-sheet">
              <Image
                src="/progress.png"
                width={1915}
                height={966}
                priority
                alt="React documentation page enhanced with a document progress card, per-page progress badges, and a right-side reading map."
              />
            </figure>
            <figure className="popup-sheet">
              <Image
                src="/popup.png"
                width={368}
                height={436}
                alt="Extension popup showing an indexed Learn React documentation set with total progress and a rebuild index button."
              />
            </figure>
          </div>
        </section>

        <section className="work-section wrap" id="how-it-works" aria-labelledby="work-title">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2 id="work-title">A progress trail through dense documentation.</h2>
          </div>
          <ol className="steps">
            {howItWorks.map((step) => (
              <li key={step.marker}>
                <span className="step-marker">{step.marker}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="proof wrap" aria-labelledby="proof-title">
          <div className="proof-heading">
            <p className="eyebrow">Product proof</p>
            <h2 id="proof-title">Progress appears where reading happens.</h2>
            <p>
              A document-wide overview sits beside page-level detail, so unfinished
              material remains visible while you read, pause, or clear page progress.
            </p>
          </div>
          <div className="proof-grid">
            <figure className="proof-main">
              <Image
                src="/progress.png"
                width={1915}
                height={966}
                alt="Reading progress interface embedded into the React documentation sidebar and page view."
              />
              <figcaption>Document page view with progress badges and reading map</figcaption>
            </figure>
            <figure className="proof-popup">
              <Image
                src="/popup.png"
                width={368}
                height={436}
                alt="Popup summary for an indexed documentation collection."
              />
              <figcaption>Index summary in the browser toolbar</figcaption>
            </figure>
          </div>
        </section>

        <section className="latest-update wrap" aria-labelledby="latest-update-title">
          <div className="latest-update-card">
            <div>
              <p className="eyebrow">Latest update</p>
              <h2 id="latest-update-title">What&apos;s new in v{latestUpdate.version}</h2>
              <p className="update-date">
                {latestUpdate.date ? `${latestUpdate.date} · ` : ""}
                {latestUpdate.title}
              </p>
            </div>
            <div className="latest-update-copy">
              <p>{latestUpdate.summary}</p>
              <ul>
                {latestUpdate.items.Added.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="text-link" href="/updates">
                View all updates
              </Link>
            </div>
          </div>
        </section>

        <section
          className="compatibility wrap"
          id="supported-docs"
          aria-labelledby="support-title"
          aria-label="Supported docs"
        >
          <div className="section-heading">
            <p className="eyebrow">Supported docs</p>
            <h2 id="support-title">Built in where you learn. Requested by you.</h2>
          </div>
          <div className="support-columns">
            <div className="support-card support-card--featured">
              <h3>Built-in support</h3>
              <p>Purpose-built adapters with default extension access.</p>
              <ul aria-label="Built-in support">
                {builtInDocs.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </div>
            <div className="support-card">
              <h3>Detectable documentation frameworks</h3>
              <p>
                Other HTTPS documentation sites can be checked for a supported
                framework before indexing. Detection can be reused for the same
                host and document range, but does not guarantee every site
                implementation.
              </p>
              <ul className="framework-list" aria-label="Detectable documentation frameworks">
                {detectableFrameworks.map((framework) => (
                  <li key={framework}>{framework}</li>
                ))}
              </ul>
            </div>
            <div className="support-card site-request-card">
              <div>
                <p className="eyebrow">Missing a site?</p>
                <h3>Point me to the docs you need next.</h3>
                <p>
                  I&apos;m expanding the built-in index catalog based on real reading
                  paths. Share a documentation site and I&apos;ll use the requests to
                  prioritize the next adapters.
                </p>
              </div>
              <SiteIndexRequestForm />
            </div>
          </div>
        </section>

        <section className="local-section" aria-labelledby="local-title">
          <div className="wrap local-grid">
            <div>
              <p className="eyebrow">Local by implementation</p>
              <h2 id="local-title">Your reading data stays local.</h2>
            </div>
            <div className="local-facts">
              <p>
                Documentation indexes, reading progress, site settings, page
                settings, and index checkpoints are stored in the extension&apos;s local
                IndexedDB database. Global settings use browser extension local storage.
              </p>
              <p>
                Import and export are actions you start from the manager page; exported
                data can optionally include reading progress and global application
                settings.
              </p>
              <small>
                These are verified product-storage facts, not a substitute for a
                privacy policy.
              </small>
            </div>
          </div>
        </section>

        <section className="faq wrap" id="faq" aria-labelledby="faq-title">
          <div className="section-heading">
            <p className="eyebrow">Questions, answered</p>
            <h2 id="faq-title">The facts before you install.</h2>
          </div>
          <div className="faq-grid">
            {faqs.map((faq) => (
              <article key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

      </main>

      <SiteFooter title="Make long documentation paths readable over time." />
    </div>
  );
}
