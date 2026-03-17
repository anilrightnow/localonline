import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

type Suggestion = {
  type: string;
  label: string;
  href: string;
};

type CityOption = {
  slug: string;
  name: string;
};

export default function GlobalSearch() {
  const router = useRouter();
  const listboxId = useId();
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const storageKey = "pub.selectedCitySlug";
  const [cities, setCities] = useState<CityOption[]>([
    { slug: "ghaziabad", name: "Ghaziabad" },
  ]);
  const [selectedCitySlug, setSelectedCitySlug] = useState("ghaziabad");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = window.localStorage.getItem(storageKey)?.trim().toLowerCase();
    if (saved) {
      setSelectedCitySlug(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(storageKey, selectedCitySlug);
  }, [selectedCitySlug]);

  useEffect(() => {
    const routeMatch = router.asPath.match(/\/c-([^/?#]+)/i);
    const routeCity = routeMatch?.[1]?.trim().toLowerCase();
    if (routeCity) {
      setSelectedCitySlug(routeCity);
    }
  }, [router.asPath]);

  useEffect(() => {
    let ignore = false;
    const loadCities = async () => {
      try {
        const response = await fetch("/api/public-search/cities");
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as CityOption[];
        if (ignore || !Array.isArray(payload) || payload.length === 0) {
          return;
        }

        const normalized = payload
          .filter((item) => item && item.slug)
          .map((item) => ({
            slug: item.slug.toLowerCase(),
            name: item.name || item.slug,
          }));
        const hasGhaziabad = normalized.some(
          (item) => item.slug === "ghaziabad",
        );
        const list = hasGhaziabad
          ? normalized
          : [{ slug: "ghaziabad", name: "Ghaziabad" }, ...normalized];
        setCities(list);
        if (!list.some((item) => item.slug === selectedCitySlug)) {
          setSelectedCitySlug("ghaziabad");
        }
      } catch {}
    };

    void loadCities();
    return () => {
      ignore = true;
    };
  }, [selectedCitySlug]);

  const canSearch = query.trim().length >= 2;

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    if (!canSearch) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const response = await fetch(
          `/api/public-search/suggestions?q=${encodeURIComponent(query.trim())}&limit=10&citySlug=${encodeURIComponent(selectedCitySlug)}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          setItems([]);
          setOpen(true);
          setActiveIndex(-1);
          return;
        }
        const payload = (await response.json()) as Suggestion[];
        setItems(payload);
        setOpen(true);
        setActiveIndex(payload.length > 0 ? 0 : -1);
      } catch {
        setItems([]);
        setOpen(true);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 160);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query, canSearch, selectedCitySlug]);

  const firstTarget = useMemo(
    () => items[activeIndex]?.href ?? items[0]?.href ?? null,
    [items, activeIndex],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstTarget) {
      void router.push(firstTarget);
      return;
    }
    if (selectedCitySlug) {
      void router.push(`/c-${selectedCitySlug}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      e.preventDefault();
      void router.push(items[activeIndex].href);
    }
  };

  return (
    <div className="pub-search-wrap">
      <form className="pub-search-form" onSubmit={onSubmit}>
        <label htmlFor="global-search" className="pub-sr-only">
          Search city, area, category, place, or business
        </label>
        <label htmlFor="global-city" className="pub-sr-only">
          Select city
        </label>
        <select
          id="global-city"
          className="pub-city-select"
          value={selectedCitySlug}
          onChange={(e) => setSelectedCitySlug(e.target.value)}
          aria-label="Select city"
        >
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
        <input
          id="global-search"
          className="pub-search-input"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (canSearch) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder="Search business in Crossing Republic, Greater Noida West"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
        />
        <small></small>
        <button className="pub-search-btn" type="submit" disabled={!canSearch}>
          Search
        </button>
      </form>

      {canSearch && open ? (
        <div
          id={listboxId}
          className="pub-search-dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {loading ? <div className="pub-search-item">Loading...</div> : null}
          {!loading && items.length === 0 ? (
            <div className="pub-search-item">No suggestions found</div>
          ) : null}
          {!loading
            ? items.map((item, index) => (
                <button
                  key={`${item.type}-${item.href}`}
                  id={`${listboxId}-opt-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  className={`pub-search-item pub-search-item-btn ${activeIndex === index ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    void router.push(item.href);
                  }}
                >
                  <span>{item.label}</span>
                  <span className="pub-search-type">{item.type}</span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
