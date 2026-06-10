import Image from "next/image";
import Link from "next/link";

type SiteHeaderProps = {
  homeAnchors?: boolean;
  signedIn?: boolean;
  userProfile?: {
    nickname: string;
    avatarInitial: string;
    avatarBackground: string;
    avatarColor: string;
  };
};

export function SiteHeader({ homeAnchors = false, signedIn = false, userProfile }: SiteHeaderProps) {
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
        <Link
          aria-label={signedIn && userProfile ? `${userProfile.nickname} account` : undefined}
          className={signedIn && userProfile ? "nav-avatar-link" : "nav-cta"}
          href={signedIn ? "/account" : "/login"}
        >
          {signedIn && userProfile ? (
            <span
              aria-hidden="true"
              className="user-avatar user-avatar--small"
              style={{
                backgroundColor: userProfile.avatarBackground,
                color: userProfile.avatarColor,
              }}
            >
              {userProfile.avatarInitial}
            </span>
          ) : signedIn ? (
            "Account"
          ) : (
            "Sign in"
          )}
        </Link>
      </nav>
    </header>
  );
}
