import Image from "next/image";
import Link from "next/link";

import {
  builtInDocs,
  detectableFrameworks,
  faqs,
  howItWorks,
  product,
  storeLinks,
} from "@/content/site";
import { StoreActions } from "./StoreActions";

export function LandingPage() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <nav className="nav wrap" aria-label="Primary navigation">
          <Link className="brand" href="/">
            <Image src="/icon.svg" width={42} height={42} alt="" priority />
            <span>
              <strong>Developer Docs</strong>
              <small>Progress Tracker</small>
            </span>
          </Link>
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#supported-docs">Supported docs</a>
            <a href="#faq">FAQ</a>
          </div>
          <a className="nav-cta" href={storeLinks.chrome}>
            Add to Chrome
          </a>
        </nav>
      </header>

      <main>
        <section className="hero wrap" aria-label="Introduction">
          <div className="hero-copy reveal">
            <p className="eyebrow">A reading ledger for developer documentation</p>
            <h1>{product.heroTitle}</h1>
            <p className="hero-text">
              Track the technical pages you have actually seen. Build a local index,
              reveal visible progress, and return to long documentation paths with
              context still intact.
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
              material remains visible while you read.
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

        <section
          className="compatibility wrap"
          id="supported-docs"
          aria-labelledby="support-title"
          aria-label="Supported docs"
        >
          <div className="section-heading">
            <p className="eyebrow">Supported docs</p>
            <h2 id="support-title">Built in where you learn. Detectable beyond it.</h2>
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
                framework before indexing. Detection does not guarantee every site
                implementation.
              </p>
              <ul className="framework-list" aria-label="Detectable documentation frameworks">
                {detectableFrameworks.map((framework) => (
                  <li key={framework}>{framework}</li>
                ))}
              </ul>
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
                Documentation indexes and reading progress are stored in the
                extension&apos;s local IndexedDB database. Global settings use browser
                extension local storage.
              </p>
              <p>
                Import and export are actions you start from the manager page; exported
                data can optionally include reading progress.
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

        <section className="closing">
          <div className="wrap closing-inner">
            <p className="eyebrow">Developer Docs Progress Tracker</p>
            <h2>Make long documentation paths readable over time.</h2>
            <StoreActions compact />
          </div>
        </section>
      </main>

      <footer className="site-footer wrap">
        <p>&copy; {new Date().getFullYear()} Developer Docs Progress Tracker</p>
        <p>Install from Chrome, Edge, or Firefox extension stores.</p>
      </footer>
    </div>
  );
}
