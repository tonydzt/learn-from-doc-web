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
      <a className="store-link" href={storeLinks.edge}>
        Edge
      </a>
      <a className="store-link" href={storeLinks.firefox}>
        Firefox
      </a>
    </div>
  );
}
