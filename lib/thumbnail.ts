import type { SearchBusinessItem } from "./publicApi";

function safeText(input?: string | null): string {
  return (input ?? "").trim();
}

function escapeSvg(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colorFromSeed(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hueA = hash % 360;
  const hueB = (hueA + 48) % 360;
  return [`hsl(${hueA} 60% 38%)`, `hsl(${hueB} 74% 52%)`];
}

function inferCategoryKey(text: string): string {
  const source = text.toLowerCase();
  if (/(restaurant|eatery|diner|food|biryani|pizza|kitchen|dhaba)/.test(source)) return "restaurant";
  if (/(hotel|resort|stay|lodge|inn)/.test(source)) return "hotel";
  if (/(hospital|clinic|doctor|medical|pharma|health|dental)/.test(source)) return "medical";
  if (/(school|college|academy|tuition|university|institute)/.test(source)) return "education";
  if (/(salon|beauty|spa|makeup|barber)/.test(source)) return "salon";
  if (/(gym|fitness|yoga|crossfit|training)/.test(source)) return "fitness";
  if (/(shop|store|mart|market|mall|retail)/.test(source)) return "shopping";
  if (/(cafe|coffee|tea|bakery)/.test(source)) return "cafe";
  if (/(repair|service|mechanic|garage)/.test(source)) return "service";
  return "generic";
}

function iconSvgForCategory(categoryKey: string): string {
  switch (categoryKey) {
    case "restaurant":
      return `<g stroke="#ffffff" stroke-width="10" stroke-linecap="round" fill="none">
        <circle cx="170" cy="160" r="56" />
        <line x1="80" y1="96" x2="80" y2="224" />
        <line x1="60" y1="112" x2="100" y2="112" />
        <line x1="60" y1="138" x2="100" y2="138" />
        <line x1="60" y1="164" x2="100" y2="164" />
        <line x1="260" y1="96" x2="260" y2="224" />
        <line x1="238" y1="96" x2="282" y2="132" />
      </g>`;
    case "hotel":
      return `<g fill="none" stroke="#ffffff" stroke-width="10" stroke-linejoin="round">
        <rect x="70" y="120" width="200" height="86" rx="12" />
        <rect x="88" y="86" width="54" height="34" rx="8" />
        <line x1="70" y1="212" x2="270" y2="212" />
      </g>`;
    case "medical":
      return `<g fill="#ffffff">
        <rect x="138" y="86" width="64" height="148" rx="10" />
        <rect x="96" y="128" width="148" height="64" rx="10" />
      </g>`;
    case "education":
      return `<g fill="#ffffff">
        <polygon points="70,142 170,92 270,142 170,192" />
        <rect x="118" y="188" width="104" height="22" rx="6" />
        <rect x="156" y="206" width="28" height="34" rx="4" />
      </g>`;
    case "salon":
      return `<g stroke="#ffffff" stroke-width="10" stroke-linecap="round" fill="none">
        <circle cx="122" cy="120" r="24" />
        <circle cx="218" cy="120" r="24" />
        <line x1="140" y1="138" x2="254" y2="236" />
        <line x1="200" y1="138" x2="86" y2="236" />
      </g>`;
    case "fitness":
      return `<g fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round">
        <rect x="62" y="128" width="24" height="72" rx="4" />
        <rect x="90" y="142" width="20" height="44" rx="4" />
        <rect x="230" y="128" width="24" height="72" rx="4" />
        <rect x="206" y="142" width="20" height="44" rx="4" />
        <line x1="110" y1="164" x2="206" y2="164" />
      </g>`;
    case "shopping":
      return `<g fill="none" stroke="#ffffff" stroke-width="10">
        <rect x="92" y="122" width="156" height="108" rx="12" />
        <path d="M124 122c0-22 16-38 46-38s46 16 46 38" />
      </g>`;
    case "cafe":
      return `<g fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round">
        <rect x="84" y="130" width="130" height="74" rx="12" />
        <path d="M214 144h20c16 0 16 46 0 46h-20" />
        <line x1="92" y1="214" x2="252" y2="214" />
        <path d="M122 92c10 8 10 18 0 28" />
        <path d="M154 86c12 10 12 22 0 34" />
      </g>`;
    case "service":
      return `<g fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
        <path d="M100 198l-18 44 44-18 128-128-26-26z" />
        <circle cx="230" cy="104" r="24" />
      </g>`;
    default:
      return `<g fill="none" stroke="#ffffff" stroke-width="10">
        <path d="M170 84c45 0 82 37 82 82 0 60-82 150-82 150S88 226 88 166c0-45 37-82 82-82z" />
        <circle cx="170" cy="166" r="26" />
      </g>`;
  }
}

function buildPlaceholderSvg(primary: string, secondary: string, label: string, categoryHint: string, areaHint: string): string {
  const shown = label.length > 34 ? `${label.slice(0, 34)}...` : label;
  const escaped = escapeSvg(shown);
  const escapedArea = escapeSvg(areaHint);
  const categoryKey = inferCategoryKey(categoryHint);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escaped}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}" />
      <stop offset="100%" stop-color="${secondary}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="30" y="30" width="1140" height="570" rx="24" fill="rgba(0,0,0,0.18)" />
  <rect x="50" y="50" width="240" height="240" rx="26" fill="rgba(255,255,255,0.15)" />
  ${iconSvgForCategory(categoryKey)}
  <text x="330" y="270" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="58" font-weight="700">${escaped}</text>
  <text x="330" y="330" fill="#e5f1ff" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="500">${escapedArea}</text>
  <g fill="rgba(255,255,255,0.18)">
    <circle cx="1060" cy="120" r="52" />
    <circle cx="1120" cy="190" r="26" />
    <rect x="940" y="474" width="190" height="36" rx="18" />
  </g>
</svg>`;
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function fallbackThumbnail(params: {
  category?: string | null;
  area?: string | null;
  city?: string | null;
  businessName?: string | null;
}): string {
  const category = safeText(params.category);
  const area = safeText(params.area);
  const city = safeText(params.city);
  const name = safeText(params.businessName);

  const label =
    category ||
    area ||
    city ||
    (name ? `${name} Listing` : "Local Business Listing");
  const areaHint = area || city || "Local area";
  const categoryHint = [category, name].filter(Boolean).join(" ");

  const seed = [category, area, city, name].filter(Boolean).join("|") || "local-business";
  const [primary, secondary] = colorFromSeed(seed.toLowerCase());
  return toDataUri(buildPlaceholderSvg(primary, secondary, label, categoryHint, areaHint));
}

function isAbsoluteHttp(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function resolveBusinessThumbnail(
  business: SearchBusinessItem,
  fallback: string
): string {
  const source = business as SearchBusinessItem & Record<string, unknown>;
  const candidates = [
    source.thumbnailUrl,
    source.thumbUrl,
    source.imageUrl,
    source.photoUrl,
    source.photo,
    source.logoUrl,
    source.coverImageUrl,
    source.mediaUrl,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (isAbsoluteHttp(trimmed) || trimmed.startsWith("data:image/")) {
      return trimmed;
    }
  }

  return fallback;
}
