// Centralised business description generation.
// Mirrors api.localonline/src/utils/businessDescription.js exactly so the
// owner edit form and the public Business Card Overview always share the
// same dynamic description source.

export interface BusinessNarrativeInput {
  name: string;
  nameHindi?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  websiteLink?: string | null;
  menuLink?: string | null;
  placeUrl?: string | null;
  description?: string | null;
  avgRating?: number | null;
  totalReviews?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  isVerified?: boolean | null;
  scrapedAt?: string | null;
  cid?: string | null;
  aboutJson?: string | null;
  businessHoursJson?: string | null;
  actionsJson?: string | null;
  reviewJson?: string | null;
  mediaJson?: string | null;
  menuJson?: string | null;
  fullJson?: string | null;
  cityName?: string;
  areaName?: string;
  serviceHints?: string[];
  promotionsCount?: number;
}

export function ensureDescription(
  existing: string | null | undefined,
  input: BusinessNarrativeInput,
  maxWords = 200,
): string {
  const trimmed = existing?.trim();
  if (trimmed && trimmed.length > 20) return trimmed;
  return generateBusinessDescription(input, maxWords);
}

function safeJson(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractKeywords(input: unknown, max = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const walk = (v: unknown) => {
    if (out.length >= max) return;
    if (v == null) return;
    if (typeof v === "string" || typeof v === "number") {
      const s = String(v || "").trim();
      if (!s) return;
      const key = s.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) {
        walk(item);
        if (out.length >= max) return;
      }
      return;
    }
    if (typeof v === "object") {
      for (const key of Object.keys(v)) {
        walk((v as Record<string, unknown>)[key]);
        if (out.length >= max) return;
      }
    }
  };
  walk(input);
  return out;
}

function sentenceList(values: unknown[]): string {
  const items = (values || [])
    .map((v) => String(v || "").trim())
    .filter((s) => Boolean(s));
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function ensureWordCount(text: string, target = 200): string {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= target) {
    return `${words.slice(0, target).join(" ")}.`;
  }
  const fillers = [
    "Customers can expect helpful guidance and practical information for planning a visit.",
    "The listing aims to summarize the business clearly so people can compare options and decide with confidence.",
    "Details above reflect the latest available data and may evolve as the listing is refreshed.",
  ];
  let i = 0;
  while (words.length < target && i < fillers.length) {
    words.push(...fillers[i].split(/\s+/));
    i += 1;
  }
  const tail = [
    "service",
    "quality",
    "value",
    "choice",
    "convenience",
    "comfort",
    "support",
    "experience",
    "reliability",
    "trust",
  ];
  let t = 0;
  while (words.length < target) {
    words.push(tail[t % tail.length]);
    t += 1;
  }
  return `${words.slice(0, target).join(" ")}.`;
}

export function generateBusinessDescription(
  input: BusinessNarrativeInput,
  maxWords = 200,
): string {
  const b = {
    name: input.name,
    name_hindi: input.nameHindi,
    address: input.address,
    description: input.description,
    phone: input.phone,
    website: input.website,
    website_link: input.websiteLink,
    menu_link: input.menuLink,
    place_url: input.placeUrl,
    avg_rating: input.avgRating,
    total_reviews: input.totalReviews,
    latitude: input.latitude,
    longitude: input.longitude,
    is_verified: input.isVerified,
    scraped_at: input.scrapedAt,
    cid: input.cid,
    actions_json: input.actionsJson,
    about_json: input.aboutJson,
    business_hours_json: input.businessHoursJson,
    review_json: input.reviewJson,
    media_json: input.mediaJson,
    menu_json: input.menuJson,
    full_json: input.fullJson,
  };

  const sentences: string[] = [];

  const name = b.name || "This business";
  const nameHindi = b.name_hindi ? ` (${b.name_hindi})` : "";
  const address = b.address ? `located at ${b.address}` : "serving its local area";
  sentences.push(`${name}${nameHindi} is a local business ${address}.`);

  if (b.description && String(b.description).trim().length > 20) {
    sentences.push(`Overview: ${String(b.description).trim()}.`);
  }

  if (b.phone || b.website || b.website_link || b.menu_link || b.place_url) {
    const parts: string[] = [];
    if (b.phone) parts.push(`phone ${b.phone}`);
    if (b.website) parts.push(`website ${b.website}`);
    if (b.website_link) parts.push(`website link ${b.website_link}`);
    if (b.menu_link) parts.push(`menu ${b.menu_link}`);
    if (b.place_url) parts.push(`place URL ${b.place_url}`);
    sentences.push(`Contact and links include ${sentenceList(parts)}.`);
  }

  if (b.avg_rating != null || b.total_reviews != null) {
    const ratingNum = b.avg_rating != null ? Number(b.avg_rating) : null;
    const rating =
      ratingNum != null && Number.isFinite(ratingNum)
        ? ratingNum.toFixed(1)
        : null;
    const reviewsNum = b.total_reviews != null ? Number(b.total_reviews) : null;
    const reviews =
      reviewsNum != null && Number.isFinite(reviewsNum) ? reviewsNum : null;
    if (rating && reviews != null) {
      sentences.push(
        `It holds a ${rating} rating based on ${reviews} reviews.`,
      );
    } else if (rating) {
      sentences.push(`It holds a ${rating} rating.`);
    } else if (reviews != null) {
      sentences.push(`It has ${reviews} reviews on record.`);
    }
  }

  if (b.latitude != null && b.longitude != null) {
    sentences.push(
      `Geo coordinates are ${b.latitude}, ${b.longitude} for precise location context.`,
    );
  }

  if (b.is_verified != null) {
    sentences.push(
      `Verification status is ${b.is_verified ? "verified" : "not verified"}.`,
    );
  }

  if (b.cid) {
    sentences.push(`Internal listing reference is CID ${b.cid}.`);
  }

  if (b.scraped_at) {
    sentences.push(`Listing data was last captured on ${b.scraped_at}.`);
  }

  const actionsJson = safeJson(b.actions_json);
  const aboutJson = safeJson(b.about_json);
  const hoursJson = safeJson(b.business_hours_json);
  const reviewJson = safeJson(b.review_json);
  const mediaJson = safeJson(b.media_json);
  const menuJson = safeJson(b.menu_json);
  const fullJson = safeJson(b.full_json);

  if (hoursJson && Array.isArray(hoursJson)) {
    const hoursSnippets = hoursJson
      .map((h: any) => {
        const day = h.day || h.Day || h.name || h.weekday;
        const open = h.open || h.opens || h.from || h.start;
        const close = h.close || h.closes || h.to || h.end;
        if (day && (open || close))
          return `${day} ${open || ""}${open && close ? "-" : ""}${close || ""}`.trim();
        return null;
      })
      .filter(Boolean)
      .slice(0, 5);
    if (hoursSnippets.length) {
      sentences.push(`Hours include ${sentenceList(hoursSnippets)}.`);
    }
  }

  const keywordPool: string[] = [];
  keywordPool.push(...extractKeywords(actionsJson, 6));
  keywordPool.push(...extractKeywords(aboutJson, 8));
  keywordPool.push(...extractKeywords(reviewJson, 6));
  keywordPool.push(...extractKeywords(fullJson, 8));
  const keywords = extractKeywords(keywordPool, 12);
  if (keywords.length) {
    sentences.push(
      `Highlights and features reference ${sentenceList(keywords)}.`,
    );
  }

  if (mediaJson && Array.isArray(mediaJson)) {
    sentences.push(`Media gallery includes ${mediaJson.length} items.`);
  }

  if (menuJson && Array.isArray(menuJson)) {
    sentences.push(`Menu data lists ${menuJson.length} items or sections.`);
  }

  if (reviewJson && Array.isArray(reviewJson)) {
    sentences.push(`Review data contains ${reviewJson.length} entries.`);
  }

  const rawText = sentences.join(" ");
  return ensureWordCount(rawText, maxWords);
}
