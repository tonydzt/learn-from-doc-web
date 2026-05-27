import { storeLinks } from "@/content/site";

type StoreActionsProps = {
  compact?: boolean;
};

export function StoreActions({ compact = false }: StoreActionsProps) {
  return (
    <div className={`store-actions${compact ? " store-actions--compact" : ""}`}>
      <a className="button button--primary" href={storeLinks.chrome}>
        Add to Chrome
        <span aria-hidden="true">+</span>
      </a>
      <a className="button button--secondary" href={storeLinks.edge}>
        Get for Edge
      </a>
      <a className="button button--secondary" href={storeLinks.firefox}>
        Get for Firefox
      </a>
    </div>
  );
}
