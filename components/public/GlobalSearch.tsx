import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getAuthToken } from "../../lib/auth";
import { apiFetch } from "../../lib/apiClient";

type Suggestion = {
  type: string;
  label: string;
  href: string;
};

type CityOption = {
  slug: string;
  name: string;
};

const suggestionOrder = ["category", "placetype", "place", "business"];

function sortSuggestions(items: Suggestion[]): Suggestion[] {
  return [...items].sort((a, b) => {
    const aIdx = suggestionOrder.indexOf(a.type.toLowerCase());
    const bIdx = suggestionOrder.indexOf(b.type.toLowerCase());
    const aRank = aIdx === -1 ? 999 : aIdx;
    const bRank = bIdx === -1 ? 999 : bIdx;
    if (aRank !== bRank) return aRank - bRank;
    return a.label.localeCompare(b.label);
  });
}

function formatSuggestionType(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "placetype") return "Place Type";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function GlobalSearch() {
  const router = useRouter();
  const listboxId = useId();
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const suppressOpenRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  // Load saved city
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(storageKey)?.trim().toLowerCase();
    if (saved) setSelectedCitySlug(saved);
  }, []);

  // Save city
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, selectedCitySlug);
  }, [selectedCitySlug]);

  // Update city from route
  useEffect(() => {
    const routeMatch = router.asPath.match(/\/c-([^/?#]+)/i);
    const routeCity = routeMatch?.[1]?.trim().toLowerCase();
    if (routeCity) setSelectedCitySlug(routeCity);
  }, [router.asPath]);

  // Update query from URL
  useEffect(() => {
    const qParam =
      typeof router.query.q === "string" ? router.query.q.trim() : "";
    if (qParam) {
      setQuery(qParam);
    }
  }, [router.query.q]);

  // Load cities
  useEffect(() => {
    let ignore = false;
    const loadCities = async () => {
      try {
        const token = getAuthToken();

        const response = await apiFetch("/api/public-search/cities", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!response.ok) return;

        const payload = (await response.json()) as CityOption[];
        if (ignore || !Array.isArray(payload) || payload.length === 0) return;

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
  const isInputFocused = () =>
    typeof document !== "undefined" &&
    inputRef.current === document.activeElement;

  // Debounced suggestions fetch
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!canSearch) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      suppressOpenRef.current = false;
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {
        const token = getAuthToken();

        const response = await apiFetch(
          `/api/public-search/suggestions?q=${encodeURIComponent(query.trim())}&limit=10&citySlug=${encodeURIComponent(selectedCitySlug)}`,
          {
            signal: controller.signal,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );

        if (!response.ok) {
          setItems([]);
          return;
        }

        const payload = (await response.json()) as Suggestion[];
        const ordered = sortSuggestions(payload);

        setItems(ordered);
        setOpen(
          !suppressOpenRef.current && ordered.length > 0 && isInputFocused(),
        );
        setActiveIndex(-1);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, canSearch, selectedCitySlug]);

  const firstTarget = useMemo(
    () => (activeIndex >= 0 ? (items[activeIndex]?.href ?? null) : null),
    [items, activeIndex],
  );

  const closeDropdown = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    suppressOpenRef.current = true;
    closeDropdown();

    if (firstTarget) {
      void router.push(firstTarget);
      return;
    }

    if (!canSearch) return;

    const params = new URLSearchParams({ q: query.trim() });
    if (selectedCitySlug) params.set("citySlug", selectedCitySlug);
    void router.push(`/search?${params.toString()}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      closeDropdown(); // ← This ensures it closes immediately
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        void router.push(items[activeIndex].href);
        return;
      }
      // Otherwise let form submit handle it
      return;
    }

    if (!open || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < 0 ? 0 : (prev + 1) % items.length));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
      return;
    }

    if (e.key === "Escape") {
      closeDropdown();
      return;
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

        <div className="pub-search-input-wrap">
          <input
            id="global-search"
            className="pub-search-input"
            type="search"
            value={query}
            ref={inputRef}
            onChange={(e) => {
              suppressOpenRef.current = false;
              setQuery(e.target.value);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => {
              // Only open if we already have suggestions AND can search
              // This prevents reopening after navigation/Enter
              if (canSearch && items.length > 0 && !suppressOpenRef.current) {
                setOpen(true);
              }
            }}
            onBlur={() => {
              window.setTimeout(closeDropdown, 150);
            }}
            placeholder="Search in Crossing Republic, Greater Noida West"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
            }
          />
          <button
            className="pub-search-inset-btn"
            type="submit"
            disabled={!canSearch}
          >
            Search
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {canSearch && open && (
        <div
          id={listboxId}
          className="pub-search-dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {loading && <div className="pub-search-item">Loading...</div>}

          {!loading && items.length === 0 && (
            <div className="pub-search-item">No suggestions found</div>
          )}

          {!loading &&
            items.map((item, index) => (
              <button
                key={`${item.type}-${item.href}`}
                id={`${listboxId}-opt-${index}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                className={`pub-search-item pub-search-item-btn ${
                  activeIndex === index ? "is-active" : ""
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  closeDropdown();
                  void router.push(item.href);
                }}
              >
                <span>{item.label}</span>
                <span className="pub-search-type">
                  {formatSuggestionType(item.type)}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
