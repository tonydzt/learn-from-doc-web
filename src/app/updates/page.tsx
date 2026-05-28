import type { Metadata } from "next";

import { product } from "@/content/site";
import { productUpdates, type UpdateCategory } from "@/content/updates";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: `Product updates | ${product.name}`,
  description:
    "Release notes for Developer Docs Progress Tracker, including new features, improvements, and fixes.",
};

const updateCategories: UpdateCategory[] = ["Added", "Improved", "Fixed"];

export default function UpdatesPage() {
  return (
    <div className="site-shell">
      <SiteHeader />

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

      </main>

      <SiteFooter title="Install the latest version from your browser store." />
    </div>
  );
}
