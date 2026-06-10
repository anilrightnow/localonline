import Link from "next/link";
import { useEffect, useState } from "react";

const CITY_STORAGE_KEY = "pub.selectedCitySlug";

const categories = [
  { label: "Restaurants", segment: "k-restaurants" },
  { label: "Salons", segment: "k-salons" },
  { label: "Gyms", segment: "k-gyms" },
  { label: "Sabji Mandi", segment: "t-sabji-mandi" },
];

export default function HomeCategoryLinks() {
  const [citySlug, setCitySlug] = useState("gautam-buddha-nagar");

  useEffect(() => {
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

  return (
    <div className="pub-hero-chips" aria-label="Popular categories">
      {categories.map((category) => (
        <Link
          key={category.segment}
          href={`/c-${citySlug}/${category.segment}`}
          className="pub-hero-chip"
        >
          {category.label}
        </Link>
      ))}
    </div>
  );
}
