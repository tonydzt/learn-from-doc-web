type SiteFooterProps = {
  title: string;
};

export function SiteFooter({ title }: SiteFooterProps) {
  return (
    <footer className="closing site-footer">
      <div className="wrap closing-inner">
        <div>
          <p className="eyebrow">Developer Docs Progress Tracker</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="wrap footer-meta">
        <p>&copy; {new Date().getFullYear()} Developer Docs Progress Tracker</p>
      </div>
    </footer>
  );
}
