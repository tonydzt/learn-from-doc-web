import Image from "next/image";
import Link from "next/link";

import { storeLinks } from "@/content/site";

type SiteHeaderProps = {
  homeAnchors?: boolean;
};

export function SiteHeader({ homeAnchors = false }: SiteHeaderProps) {
  const anchorPrefix = homeAnchors ? "" : "/";

  return (
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
          <Link href={`${anchorPrefix}#how-it-works`}>How it works</Link>
          <Link href={`${anchorPrefix}#supported-docs`}>Supported docs</Link>
          <Link href="/updates">Updates</Link>
          <Link href="/contact">Contact</Link>
          <Link href={`${anchorPrefix}#faq`}>FAQ</Link>
        </div>
        <a className="nav-cta" href={storeLinks.chrome}>
          Add to Chrome
        </a>
      </nav>
    </header>
  );
}
