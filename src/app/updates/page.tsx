import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { product, storeLinks } from "@/content/site";
import { productUpdates, type UpdateCategory } from "@/content/updates";
import { StoreActions } from "@/components/StoreActions";

export const metadata: Metadata = {
  title: `Product updates | ${product.name}`,
  description:
    "Release notes for Developer Docs Progress Tracker, including new features, improvements, and fixes.",
};

const updateCategories: UpdateCategory[] = ["Added", "Improved", "Fixed"];

export default function UpdatesPage() {
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
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#supported-docs">Supported docs</Link>
            <Link href="/updates">Updates</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
          <a className="nav-cta" href={storeLinks.chrome}>
            Add to Chrome
          </a>
        </nav>
      </header>

      <main>
        <section className="updates-hero wrap" aria-labelledby="updates-title">
          <p className="eyebrow">Release notes</p>
          <h1 id="updates-title">Product updates</h1>
          <p>
            Follow the features, improvements, and fixes shipped for Developer Docs
            Progress Tracker.
          </p>
        </section>

        <section className="updates-list wrap" aria-label="Version history">
          {productUpdates.map((update) => (
            <article
              className="update-card"
              key={update.version}
              aria-label={`v${update.version} ${update.title}`}
            >
              <div className="update-card-header">
                <div>
                  <p className="update-version">v{update.version}</p>
                  <h2>{update.title}</h2>
                </div>
                <time dateTime={update.date}>{update.date}</time>
              </div>
              <p>{update.summary}</p>
              <div className="update-groups">
                {updateCategories.map((category) => {
                  const items = update.items[category];

                  if (!items?.length) {
                    return null;
                  }

                  return (
                    <section key={category} aria-labelledby={`${update.version}-${category}`}>
                      <h3 id={`${update.version}-${category}`}>{category}</h3>
                      <ul>
                        {items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        <section className="closing">
          <div className="wrap closing-inner">
            <p className="eyebrow">Developer Docs Progress Tracker</p>
            <h2>Install the latest version from your browser store.</h2>
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
