import Link from "next/link";
import type { RelatedLinks } from "../../lib/publicApi";

type SeoLinkSectionsProps = {
  links: RelatedLinks;
};

function LinkGroup({ title, items }: { title: string; items: Array<{ label: string; href: string }> }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="pub-link-group">
      <h3 className="pub-link-title">{title}</h3>
      <div className="pub-chip-list">
        {items.map((item) => (
          <Link className="pub-chip" key={`${title}-${item.href}`} href={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function SeoLinkSections({ links }: SeoLinkSectionsProps) {
  return (
    <div>
      <LinkGroup title="Cities" items={links.cities} />
      <LinkGroup title="Areas" items={links.areas} />
      <LinkGroup title="Categories" items={links.categories} />
      <LinkGroup title="Place Types" items={links.placeTypes} />
      <LinkGroup title="Places" items={links.places} />
    </div>
  );
}

