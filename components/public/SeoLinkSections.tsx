import Link from "next/link";
import { useEffect, useState } from "react";
import type { RelatedLinks } from "../../lib/publicApi";

type SeoLinkSectionsProps = {
  links: RelatedLinks;
};

const CITY_STORAGE_KEY = "pub.selectedCitySlug";

function LinkGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="pub-link-group">
      <h3 className="pub-link-title">{title}</h3>
      <div className="pub-chip-list">
        {items.map((item) => (
          <Link
            className="pub-chip"
            key={`${title}-${item.href}`}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function useSelectedCitySlug() {
  const [citySlug, setCitySlug] = useState("ghaziabad");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage
      .getItem(CITY_STORAGE_KEY)
      ?.trim()
      .toLowerCase();
    if (saved) setCitySlug(saved);

    const updateCity = (nextValue?: string | null) => {
      const next = nextValue?.trim().toLowerCase();
      if (next) setCitySlug(next);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === CITY_STORAGE_KEY && event.newValue) {
        updateCity(event.newValue);
      }
    };
    const onCityChange = (event: Event) => {
      updateCity((event as CustomEvent<string>).detail);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("localonline:city-change", onCityChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("localonline:city-change", onCityChange);
    };
  }, []);
  return citySlug;
}

function prependCityToCategoryLinks(
  items: Array<{ label: string; href: string }>,
  citySlug: string,
) {
  // Transform /k-{slug} to /c-{citySlug}/k-{slug} for categories
  // This ensures categories link to the selected city
  return items.map((item) => {
    if (item.href.startsWith("/k-")) {
      return { ...item, href: `/c-${citySlug}${item.href}` };
    }
    return item;
  });
}

export default function SeoLinkSections({ links }: SeoLinkSectionsProps) {
  const citySlug = useSelectedCitySlug();
  const categoriesWithCity = prependCityToCategoryLinks(
    links.categories || [],
    citySlug,
  );

  return (
    <div>
      <LinkGroup title="Cities" items={links.cities} />
      <LinkGroup title="Areas" items={links.areas} />
      <LinkGroup title="Categories" items={categoriesWithCity} />
      {/*<LinkGroup title="Place Types" items={links.placeTypes} />*/}
      <LinkGroup title="Places" items={links.places} />
    </div>
  );
}
