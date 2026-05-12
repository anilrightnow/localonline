import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BusinessCard from "../components/public/BusinessCard";
import AdRequestCard from "../components/public/AdRequestCard";
import SectionCard from "../components/public/SectionCard";
import SeoLinkSections from "../components/public/SeoLinkSections";
import SiteShell from "../components/public/SiteShell";
import {
  fetchBusinessCanonical,
  fetchBusinessCanonicalByCid,
  fetchBusinessData,
  fetchSearchData,
  getApiBaseUrl,
  type BusinessApiResponse,
  type SearchApiResponse,
} from "../lib/publicApi";
import {
  getApiErrorMessage,
  getApiErrorMessageFromResponse,
} from "../lib/apiError";
import { fallbackThumbnail } from "../lib/thumbnail";
import {
  buildCanonicalPath,
  parseSeoSegments,
  type ParsedSeoRoute,
} from "../lib/seoRoutes";
import { trackAnalyticsEvent } from "../lib/analytics";
import { getAuthToken, setAuthTokenCookie } from "../lib/auth";
import { getAuthTokenFromCookieHeader } from "../lib/authCookie";
import type { UserSession } from "../lib/session";
import { getUserSessionFromToken, hasRole } from "../lib/session";
import {
  Phone,
  Globe,
  MessageCircle,
  Mail,
  Info,
  Clock,
  Image as ImageIcon,
  Menu as MenuIcon,
  Star,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";

type Props = {
  parsed: ParsedSeoRoute;
  canonicalPath: string;
  apiData: SearchApiResponse | null;
  businessData: BusinessApiResponse | null;
  currentPage: number;
};

type DetailTab = "overview" | "about" | "reviews" | "menu" | "gallery";
type MenuRenderItem = {
  name: string;
  detail: string;
  priceText: string;
  description: string;
};
type MenuRenderSection = { title: string; items: MenuRenderItem[] };

function titleFor(parsed: ParsedSeoRoute): string {
  const city = humanizeSlug(parsed.citySlug);
  const area = humanizeSlug(parsed.areaSlug);
  const category = humanizeSlug(parsed.categorySlug);
  const placeType = humanizeSlug(parsed.placeTypeSlug);
  const place = humanizeSlug(parsed.placeSlug);
  if (parsed.kind === "city") return `Businesses in ${city}`;
  if (parsed.kind === "cityArea") return `${area}, ${city} businesses`;
  if (parsed.kind === "cityCategory") return `${category} in ${city}`;
  if (parsed.kind === "cityAreaCategory")
    return `${category} in ${area}, ${city}`;
  if (parsed.kind === "cityAreaPlaceType")
    return `${placeType} in ${area}, ${city}`;
  if (parsed.kind === "cityAreaPlaceTypePlace")
    return `${place} (${placeType}) in ${area}, ${city}`;
  return `Business details`;
}

function descriptionFor(parsed: ParsedSeoRoute): string {
  if (parsed.kind === "business") {
    return "Business profile page with contact information, location context, and related discovery links.";
  }

  return "Hyper-local search result page with SEO-friendly URL structure and related entity navigation.";
}

function buildListDescription(
  parsed: ParsedSeoRoute,
  items: Array<{ name: string }>,
  cityName: string,
  areaName?: string,
): string {
  const place = areaName ? `${areaName}, ${cityName}` : cityName;
  const category =
    humanizeSlug(parsed.categorySlug) || humanizeSlug(parsed.placeTypeSlug);
  const names = items
    .slice(0, 5)
    .map((item) => item.name)
    .filter(Boolean)
    .join(", ");
  const topic = category ? `${category} businesses` : "local businesses";
  if (!names) {
    return `Explore ${topic} in ${place}. Compare ratings, location details, and trusted listings on LocalOnline.`;
  }
  return `Explore ${topic} in ${place}. Top listings include ${names}. Compare reviews, addresses, and discover nearby options.`;
}

function dedupeKeywords(raw: Array<string | undefined | null>): string {
  const seen = new Map<string, string>();
  for (const value of raw) {
    if (!value) continue;
    const cleaned = value.trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, cleaned);
    }
  }
  return Array.from(seen.values()).join(", ");
}

function getMenuEntryTitle(entry: Record<string, unknown>): string {
  const candidates = [
    entry.name,
    entry.Name,
    entry.title,
    entry.Title,
    entry.itemName,
    entry.ItemName,
    entry.menuItem,
    entry.MenuItem,
    entry.category,
    entry.Category,
    entry.type,
    entry.Type,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "Menu item";
}

function getMenuEntryDetail(entry: Record<string, unknown>): string {
  const rawPrice = entry.price ?? entry.Price ?? entry.amount ?? entry.Amount;
  const rawDescription =
    entry.description ??
    entry.Description ??
    entry.details ??
    entry.Details ??
    entry.value ??
    entry.Value;

  let priceText = "";
  if (typeof rawPrice === "number" && Number.isFinite(rawPrice)) {
    priceText = `Rs. ${rawPrice}`;
  } else if (typeof rawPrice === "string" && rawPrice.trim()) {
    priceText = rawPrice.trim();
  }

  let descriptionText = "";
  if (typeof rawDescription === "string" && rawDescription.trim()) {
    descriptionText = rawDescription.trim();
  }

  if (priceText && descriptionText) return `${priceText} - ${descriptionText}`;
  return priceText || descriptionText;
}

function getMenuEntryPrice(entry: Record<string, unknown>): string {
  const rawPrice = entry.price ?? entry.Price ?? entry.amount ?? entry.Amount;
  if (typeof rawPrice === "number" && Number.isFinite(rawPrice)) {
    return `Rs. ${rawPrice}`;
  }
  if (typeof rawPrice === "string" && rawPrice.trim()) {
    return rawPrice.trim();
  }
  return "";
}

function getMenuEntryDescription(entry: Record<string, unknown>): string {
  const rawDescription =
    entry.description ??
    entry.Description ??
    entry.details ??
    entry.Details ??
    entry.value ??
    entry.Value;
  if (typeof rawDescription === "string" && rawDescription.trim()) {
    return rawDescription.trim();
  }
  return "";
}

function getMenuSectionTitle(entry: Record<string, unknown>): string {
  const candidates = [
    entry.Category,
    entry.category,
    entry.Name,
    entry.name,
    entry.Title,
    entry.title,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "Menu";
}

type MediaItem = { largeUrl?: string; thumbUrl?: string };
type AboutItem = {
  Key?: string;
  key?: string;
  Value?: string[];
  value?: string[];
};
type HoursGroup = {
  Category?: string;
  category?: string;
  Hours?: Array<{ Day?: string; Time?: string; day?: string; time?: string }>;
  hours?: Array<{ day?: string; time?: string }>;
};
type ReviewItem = {
  Reviewer?: string;
  reviewer?: string;
  Rating?: number;
  rating?: number;
  Text?: string;
  text?: string;
  Date?: string;
  date?: string;
};

function parseJsonValue(value?: string | null): unknown {
  if (!value) return null;
  try {
    let parsed: unknown = JSON.parse(value);
    if (typeof parsed === "string") {
      const trimmed = parsed.trim();
      if (trimmed && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          // Fall through with the first parse result.
        }
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseJsonArray<T>(value?: string | null): T[] {
  const parsed = parseJsonValue(value);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function parseReviewJson(value?: string | null): ReviewItem[] {
  const parsed = parseJsonValue(value);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed as ReviewItem[];
  if (typeof parsed === "object") {
    const obj = parsed as { Reviews?: unknown; reviews?: unknown };
    const reviews = obj.Reviews ?? obj.reviews;
    return Array.isArray(reviews) ? (reviews as ReviewItem[]) : [];
  }
  return [];
}

function stripHtml(input?: string | null): string {
  if (!input) return "";
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickMediaUrl(item: any): string | undefined {
  return item?.largeUrl || item?.thumbUrl || item?.LargeUrl || item?.ThumbUrl;
}

function toExternalUrl(url?: string | null): string | null {
  if (!url) return null;
  let trimmed = url.trim();
  if (!trimmed) return null;
  const index: number = trimmed.indexOf("?utm_source=");
  trimmed = index !== -1 ? trimmed.substring(0, index) : trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return `https://${trimmed}`;
}

function toSchemaDayName(value?: string): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  const map: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };
  return map[v] ?? null;
}

function to24h(value: string): string | null {
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) return null;
  let hour = Number.parseInt(match[1] ?? "0", 10);
  const minute = Number.parseInt(match[2] ?? "0", 10);
  const ap = match[3];
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (ap === "pm" && hour < 12) hour += 12;
  if (ap === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseHoursRange(value?: string): { opens?: string; closes?: string } {
  if (!value) return {};
  const cleaned = value
    .replace(/\u202f/g, " ")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (cleaned.includes("closed")) return {};
  const parts = cleaned.split("-");
  if (parts.length < 2) return {};
  const opens = to24h(parts[0] ?? "");
  const closes = to24h(parts[1] ?? "");
  return { opens: opens ?? undefined, closes: closes ?? undefined };
}

function toStars(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "No rating";
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return `${"\u2605".repeat(rounded)}${"\u2606".repeat(5 - rounded)}`;
}

function readPrefixedSlugFromHref(href: string, prefix: string): string | null {
  const piece = href
    .split("/")
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith(prefix));
  if (!piece) return null;
  const slug = piece.slice(prefix.length).trim().toLowerCase();
  return slug || null;
}

function hasDevanagari(value?: string | null): boolean {
  if (!value) return false;
  return /[\u0900-\u097F]/.test(value);
}

function pickFirstHindiName(value: unknown): string | null {
  if (typeof value === "string") {
    return hasDevanagari(value) ? value.trim() : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = pickFirstHindiName(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const [key, raw] of Object.entries(obj)) {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, "");
      if (
        normalizedKey.includes("hindiname") ||
        normalizedKey.includes("namehindi") ||
        normalizedKey.includes("namehi") ||
        normalizedKey.includes("localname")
      ) {
        const direct = pickFirstHindiName(raw);
        if (direct) return direct;
      }
    }
    for (const raw of Object.values(obj)) {
      const nested = pickFirstHindiName(raw);
      if (nested) return nested;
    }
  }
  return null;
}

function shouldHideBusinessInfoHeading(items: AboutItem[]): boolean {
  if (items.length === 0) return false;
  const normalized = items.map((item) =>
    (item.Key ?? item.key ?? "").toLowerCase().replace(/\s+/g, ""),
  );
  return normalized.every(
    (key) =>
      key === "locatedin" || key === "action" || /^action:\d+$/.test(key),
  );
}

function splitLabelAndValue(raw: string): { label: string; value: string } {
  const idx = raw.indexOf(":");
  if (idx <= 0) return { label: "", value: raw.trim() };
  return {
    label: raw.slice(0, idx).trim(),
    value: raw.slice(idx + 1).trim(),
  };
}

function shouldDisplayAboutKey(rawKey: string): boolean {
  const hiddenKeys = ["address", "authority", "oloc", "locatedin", "phone"];
  let isShow = true;
  hiddenKeys.forEach((element) => {
    if (rawKey.trim().toLowerCase().indexOf(element) >= 0) {
      isShow = false;
    }
  });
  return rawKey.trim().length > 0 && isShow;
}

function shouldHideAboutEntry(rawKey: string, rawValue: string): boolean {
  const hiddenKeys = ["action"];
  let isShow = true;
  hiddenKeys.forEach((element) => {
    if (rawKey.trim().toLowerCase().indexOf(element) >= 0) {
      isShow = false;
    }
  });
  const key = rawKey.trim();
  const value = String(rawValue ?? "").trim();
  return (!key || !value) && isShow;
}

function normalizeMediaUrl(input?: string): string | null {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return null;
  if (value.includes("null") || value.includes("undefined")) return null;
  return value;
}

function maskPhone(value?: string | null): string {
  if (!value) return "Not available";
  const raw = value.trim();
  if (!raw) return "Not available";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return "*****";
  return `${"*".repeat(Math.max(5, digits.length - 4))}${digits.slice(-4)}`;
}

function whatsappLink(
  phone?: string | null,
  businessName?: string | null,
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(
    `Hi, I am interested in ${businessName ?? "your business"}.`,
  );
  return `https://wa.me/${digits}?text=${text}`;
}

function emailShareLink(detail?: BusinessApiResponse["detail"]): string {
  const subject = encodeURIComponent(
    `Business contact: ${detail?.name ?? "Business"}`,
  );
  const body = encodeURIComponent(
    [
      `Business: ${detail?.name ?? "-"}`,
      `Phone: ${detail?.phone ?? "-"}`,
      `Website: ${detail?.website ?? "-"}`,
      `Address: ${detail?.address ?? "-"}`,
    ].join("\n"),
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

function buildBusinessNarrative(params: {
  name: string;
  city?: string;
  area?: string;
  address?: string | null;
  rating?: number | null;
  reviews?: number | null;
  hasPhone: boolean;
  hasWebsite: boolean;
  aboutKeys: string[];
  hoursSummary?: string;
  serviceHints: string[];
  promotionsCount: number;
}): string {
  const locationParts = [params.area, params.city].filter(Boolean);
  const location =
    locationParts.length > 0 ? locationParts.join(", ") : "this area";
  const ratingLine =
    params.rating != null
      ? `${params.name} is currently rated ${params.rating.toFixed(1)} based on ${params.reviews ?? 0} reviews.`
      : `${params.name} is listed as a local business in ${location}.`;
  const contactLine =
    params.hasPhone || params.hasWebsite
      ? `The listing includes ${params.hasPhone ? "phone contact" : "contact information"}${params.hasWebsite ? " and website details" : ""} to help visitors reach the business quickly.`
      : "Contact details are limited, but core location and listing information is available.";
  const addressLine = params.address
    ? `Address reference: ${params.address}.`
    : `Address details are currently minimal, but the listing is mapped to ${location}.`;
  const aboutLine =
    params.aboutKeys.length > 0
      ? `Business highlights include ${params.aboutKeys.slice(0, 5).join(", ")}.`
      : "The profile focuses on essential listing data and practical visit details.";
  const hoursLine = params.hoursSummary
    ? `Operating information: ${params.hoursSummary}.`
    : "Operating hours may vary and should be confirmed before visiting.";
  const servicesLine =
    params.serviceHints.length > 0
      ? `Service cues mention ${params.serviceHints.slice(0, 5).join(", ")} for customers comparing options nearby.`
      : "Users can compare this listing with nearby alternatives by category and area.";
  const promoLine =
    params.promotionsCount > 0
      ? `There are currently ${params.promotionsCount} active promotional placements connected to this profile.`
      : "No active promotions are published right now, so customers primarily rely on profile details and reviews.";
  const explorationLine = `This page also connects to related categories, areas, and nearby searches, making discovery easier for people exploring ${location}.`;

  const sentences = [
    `${params.name} is a local business profile for ${location}.`,
    ratingLine,
    contactLine,
    addressLine,
    aboutLine,
    hoursLine,
    servicesLine,
    promoLine,
    explorationLine,
  ];

  return sentences.join(" ");
}

export default function SeoPage({
  parsed,
  canonicalPath,
  apiData,
  businessData,
  currentPage,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const links = apiData?.relatedLinks ?? businessData?.relatedLinks ?? null;
  const totalCount = apiData?.pagination.totalCount ?? 0;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageBase = canonicalPath;
  const pageUrl =
    currentPage > 1 ? `${pageBase}?page=${currentPage}` : pageBase;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAllScrapedReviews, setShowAllScrapedReviews] = useState(false);
  const [showAllApprovedReviews, setShowAllApprovedReviews] = useState(false);
  const [showMoreGeneratedSearches, setShowMoreGeneratedSearches] =
    useState(false);
  const [failedMediaUrls, setFailedMediaUrls] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [showContactGate, setShowContactGate] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPassword, setContactPassword] = useState("");
  const [contactPasswordVisible, setContactPasswordVisible] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [authGatePurpose, setAuthGatePurpose] = useState<"contact" | "review">(
    "contact",
  );

  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const session = useMemo<UserSession>(() => {
    if (!isClientMounted) return { userId: null, email: null, roles: [] };
    return getUserSessionFromToken(getAuthToken());
  }, [isClientMounted, contactUnlocked]);

  const isStrictUser =
    session.roles.includes("User") &&
    !hasRole(session, "Admin") &&
    !hasRole(session, "SuperAdmin") &&
    !session.roles.includes("Owner");

  useEffect(() => {
    if (parsed.kind !== "business") return;
    if (!businessData?.detail?.cid) return;
    trackAnalyticsEvent({
      eventType: "business_view",
      cid: businessData.detail.cid,
      source: "business-page",
      payload: { path: canonicalPath },
    });
  }, [parsed.kind, businessData?.detail?.cid, canonicalPath]);
  const [contactError, setContactError] = useState<string | null>(null);

  const media = businessData
    ? parseJsonArray<MediaItem>(businessData.detail.mediaJson)
    : [];
  const mediaUrls = media
    .map((item) => normalizeMediaUrl(pickMediaUrl(item) ?? undefined))
    .filter((item): item is string => Boolean(item));
  const visibleMediaUrls = mediaUrls.filter(
    (url) => !failedMediaUrls.includes(url),
  );
  const aboutItems = businessData
    ? parseJsonArray<AboutItem>(businessData.detail.aboutJson)
    : [];
  const hoursGroups = businessData
    ? parseJsonArray<HoursGroup>(businessData.detail.businessHoursJson)
    : [];
  const scrapedReviews = businessData
    ? parseReviewJson(businessData.detail.reviewJson)
    : [];
  const effectiveCitySlug = businessData?.canonical.citySlug ?? parsed.citySlug;
  const effectiveAreaSlug = businessData?.canonical.areaSlug ?? parsed.areaSlug;
  const effectiveCityName =
    businessData?.canonical.cityName ?? humanizeSlug(effectiveCitySlug);
  const effectiveAreaName =
    businessData?.canonical.areaName ??
    (effectiveAreaSlug ? humanizeSlug(effectiveAreaSlug) : undefined);
  const effectiveBusinessName =
    businessData?.detail.name ?? businessData?.canonical.businessName;
  const hindiBusinessName = businessData?.detail?.name_hindi;
  const hideBusinessInfoHeading = shouldHideBusinessInfoHeading(aboutItems);
  const fallbackListThumb = fallbackThumbnail({
    category: humanizeSlug(parsed.categorySlug),
    area: effectiveAreaName,
    city: effectiveCityName,
  });
  const pageTitle =
    parsed.kind === "business" && businessData
      ? `${businessData.detail.name}${effectiveAreaName ? ` in ${effectiveAreaName}` : ""}${effectiveCityName ? `, ${effectiveCityName}` : ""} | LocalOnline`
      : (apiData?.seo?.title ?? titleFor(parsed));
  const pageDescription =
    parsed.kind === "business" && businessData
      ? businessData.detail.description?.trim() ||
        `View ${businessData.detail.name}${effectiveAreaName ? ` in ${effectiveAreaName}` : ""}${effectiveCityName ? `, ${effectiveCityName}` : ""}. Check address, contact details, reviews, hours, menu and photos.`
      : (apiData?.seo?.description ??
        buildListDescription(
          parsed,
          apiData?.items ?? [],
          effectiveCityName,
          effectiveAreaName,
        ));
  //console.log("page desc " + pageDescription);
  const dynamicKeywords = dedupeKeywords([
    effectiveCityName,
    effectiveAreaName,
    humanizeSlug(parsed.categorySlug),
    humanizeSlug(parsed.placeTypeSlug),
    humanizeSlug(parsed.placeSlug),
    businessData?.detail.name,
    ...(apiData?.items?.slice(0, 12).map((item) => item.name) ?? []),
    ...(links?.categories?.slice(0, 8).map((item) => item.label) ?? []),
    ...(links?.areas?.slice(0, 8).map((item) => item.label) ?? []),
    ...(aboutItems
      .slice(0, 20)
      .map((item) => (item.Key ?? item.key ?? "").toString()) ?? []),
    ...(apiData?.seo?.keywords ?? []),
    ...(apiData?.queryContext?.area?.tags ?? []),
    ...(apiData?.queryContext?.category?.tags ?? []),
    ...(apiData?.queryContext?.place?.tags ?? []),
    apiData?.queryContext?.city?.name,
    apiData?.queryContext?.area?.name,
    apiData?.queryContext?.category?.name,
    apiData?.queryContext?.placeType?.name,
    apiData?.queryContext?.place?.name,
    "local business listing",
    "near me",
  ]);

  const menuSections = useMemo(() => {
    const rows = parseJsonArray<Record<string, unknown>>(
      businessData?.detail.menuJson,
    );
    const sections: MenuRenderSection[] = [];

    for (const row of rows) {
      const nestedItems = Array.isArray((row as { Items?: unknown }).Items)
        ? ((row as { Items: unknown[] }).Items as unknown[])
        : Array.isArray((row as { items?: unknown }).items)
          ? ((row as { items: unknown[] }).items as unknown[])
          : [];

      if (nestedItems.length > 0) {
        const sectionItems = nestedItems
          .map((item) =>
            item && typeof item === "object"
              ? (item as Record<string, unknown>)
              : null,
          )
          .filter((item): item is Record<string, unknown> => Boolean(item))
          .map((item) => {
            const name = getMenuEntryTitle(item);
            const priceText = getMenuEntryPrice(item);
            const description = getMenuEntryDescription(item);
            const detail = getMenuEntryDetail(item);
            return { name, priceText, description, detail };
          })
          .filter(
            (item) => item.name && item.name.toLowerCase() !== "menu item",
          )
          .slice(0, 80);

        if (sectionItems.length > 0) {
          sections.push({
            title: getMenuSectionTitle(row),
            items: sectionItems,
          });
        }
        continue;
      }

      const fallbackName = getMenuEntryTitle(row);
      const fallbackPrice = getMenuEntryPrice(row);
      const fallbackDescription = getMenuEntryDescription(row);
      const fallbackDetail = getMenuEntryDetail(row);
      if (fallbackName && fallbackName.toLowerCase() !== "menu item") {
        sections.push({
          title: "Menu",
          items: [
            {
              name: fallbackName,
              priceText: fallbackPrice,
              description: fallbackDescription,
              detail: fallbackDetail,
            },
          ],
        });
      }
    }

    return sections.slice(0, 40);
  }, [businessData?.detail.menuJson]);
  const hasMenuItems = menuSections.some((section) => section.items.length > 0);
  const detailTabs: Array<{ id: DetailTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "about", label: "Details" },
    { id: "reviews", label: "Reviews" },
    ...(hasMenuItems ? [{ id: "menu" as DetailTab, label: "Menu" }] : []),
    { id: "gallery", label: "Photos" },
  ];
  const generatedNarrative = useMemo(() => {
    if (!businessData) return "";
    const aboutKeys = aboutItems
      .map((item) => (item.Key ?? item.key ?? "").toString().trim())
      .filter(Boolean);
    const firstHoursGroup = hoursGroups.find(
      (group) => (group.Hours ?? group.hours ?? []).length > 0,
    );
    const firstHours = firstHoursGroup
      ? (firstHoursGroup.Hours ?? firstHoursGroup.hours ?? [])
      : [];
    const hoursSummary = firstHours
      .slice(0, 3)
      .map(
        (row) =>
          `${((row as any).Day ?? row.day ?? "Day") as string} ${((row as any).Time ?? row.time ?? "N/A") as string}`,
      )
      .join("; ");

    return buildBusinessNarrative({
      name: businessData.detail.name,
      city: effectiveCityName,
      area: effectiveAreaName,
      address: businessData.detail.address,
      rating: businessData.detail.rating,
      reviews: businessData.detail.totalReviews,
      hasPhone: Boolean(businessData.detail.phone),
      hasWebsite: Boolean(toExternalUrl(businessData.detail.website)),
      aboutKeys,
      hoursSummary: hoursSummary || undefined,
      serviceHints: businessData.ownerProfile?.services ?? [],
      promotionsCount: businessData.activePromotions?.length ?? 0,
    });
  }, [
    aboutItems,
    businessData,
    effectiveAreaName,
    effectiveCityName,
    hoursGroups,
  ]);
  const breadcrumbs = buildBreadcrumbs(parsed, {
    citySlug: effectiveCitySlug,
    areaSlug: effectiveAreaSlug,
    cityName: effectiveCityName,
    areaName: effectiveAreaName,
    businessName: effectiveBusinessName,
  });

  const generatedSearchLinks = useMemo(() => {
    if (!links) return [];
    const citySlug = effectiveCitySlug;
    if (!citySlug) return [];

    const areaCandidates = links.areas
      .map((item) => ({
        slug: readPrefixedSlugFromHref(item.href, "a-"),
        label: item.label.split(",")[0]?.trim() || item.label.trim(),
      }))
      .filter((item): item is { slug: string; label: string } =>
        Boolean(item.slug && item.label),
      );

    const categoryCandidates = links.categories
      .map((item) => ({
        slug: readPrefixedSlugFromHref(item.href, "k-"),
        label: item.label.trim(),
      }))
      .filter((item): item is { slug: string; label: string } =>
        Boolean(item.slug && item.label),
      );

    const areas =
      areaCandidates.length > 0
        ? areaCandidates
        : effectiveAreaSlug
          ? [
              {
                slug: effectiveAreaSlug,
                label: effectiveAreaName ?? humanizeSlug(effectiveAreaSlug),
              },
            ]
          : [];

    const categories =
      categoryCandidates.length > 0
        ? categoryCandidates
        : parsed.categorySlug
          ? [
              {
                slug: parsed.categorySlug,
                label: humanizeSlug(parsed.categorySlug),
              },
            ]
          : [];

    if (areas.length === 0 || categories.length === 0) return [];

    const cityLabel = effectiveCityName;
    const combos: Array<{ label: string; href: string }> = [];
    for (const category of categories) {
      for (const area of areas) {
        combos.push({
          label: `${category.label} in ${area.label} - ${cityLabel}`,
          href: `/c-${citySlug}/a-${area.slug}/k-${category.slug}`,
        });
      }
    }

    const selectedAreaSlug = effectiveAreaSlug?.toLowerCase();
    const selectedCategorySlug = parsed.categorySlug?.toLowerCase();
    combos.sort((a, b) => {
      const aArea = readPrefixedSlugFromHref(a.href, "a-");
      const bArea = readPrefixedSlugFromHref(b.href, "a-");
      const aCategory = readPrefixedSlugFromHref(a.href, "k-");
      const bCategory = readPrefixedSlugFromHref(b.href, "k-");
      const aScore =
        (aArea === selectedAreaSlug ? 1 : 0) +
        (aCategory === selectedCategorySlug ? 1 : 0);
      const bScore =
        (bArea === selectedAreaSlug ? 1 : 0) +
        (bCategory === selectedCategorySlug ? 1 : 0);
      if (aScore !== bScore) return bScore - aScore;
      return a.label.localeCompare(b.label);
    });

    const unique = new Map<string, { label: string; href: string }>();
    for (const combo of combos) {
      if (!unique.has(combo.href)) unique.set(combo.href, combo);
      if (unique.size >= 25) break;
    }
    return Array.from(unique.values());
  }, [
    links,
    effectiveCitySlug,
    effectiveAreaSlug,
    effectiveCityName,
    parsed.categorySlug,
  ]);

  useEffect(() => {
    if (lightboxIndex < visibleMediaUrls.length) return;
    setLightboxIndex(0);
    if (visibleMediaUrls.length === 0) {
      setLightboxOpen(false);
    }
  }, [lightboxIndex, visibleMediaUrls.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getAuthToken();
    if (token) {
      setContactUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "menu" && !hasMenuItems) {
      setActiveTab("overview");
    }
  }, [activeTab, hasMenuItems]);

  // Add this helper function inside your component
  function getDayNameOnly(dayValue: string) {
    if (!dayValue) return "Day";

    // Array of valid day names
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // First, try to find if any day name exists in the string
    for (const day of dayNames) {
      if (
        dayValue.trim().toLowerCase().indexOf(day.trim().toLowerCase()) >= 0
      ) {
        dayValue = day; // Return clean day name only
        break;
      }
    }
    // Final fallback
    return dayValue;
  }

  const openingHoursSpecification = useMemo(() => {
    const list: Array<{
      "@type": "OpeningHoursSpecification";
      dayOfWeek: string;
      opens?: string;
      closes?: string;
    }> = [];
    for (const group of hoursGroups) {
      const hours = group.Hours ?? group.hours ?? [];
      for (const row of hours) {
        const dayRaw = ((row as any).Day ?? row.day ?? "").toString();
        const timeRaw = ((row as any).Time ?? row.time ?? "").toString();
        let dayOfWeekOnly = toSchemaDayName(dayRaw) ?? "";
        const dayOfWeek = getDayNameOnly(dayOfWeekOnly);
        if (!dayOfWeek) continue;
        const parsedRange = parseHoursRange(timeRaw);
        list.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek,
          opens: parsedRange.opens,
          closes: parsedRange.closes,
        });
      }
    }
    return list.length > 0 ? list : undefined;
  }, [hoursGroups]);

  const schemaReviews = useMemo(() => {
    const list = scrapedReviews
      .slice(0, 10)
      .map((review) => {
        const body = stripHtml(review.Text ?? review.text);
        const rating = review.Rating ?? review.rating;
        const author = review.Reviewer ?? review.reviewer;
        const datePublished = review.Date ?? review.date;
        if (!body || !rating || !author) return null;
        return {
          "@type": "Review",
          reviewBody: body,
          reviewRating: { "@type": "Rating", ratingValue: rating },
          author: { "@type": "Person", name: author },
          datePublished: datePublished ?? undefined,
        };
      })
      .filter(Boolean);
    return list.length > 0 ? list : undefined;
  }, [scrapedReviews]);

  const sameAs = useMemo(() => {
    const urls = [
      toExternalUrl(businessData?.detail.website),
      toExternalUrl(businessData?.detail.websiteLink),
      toExternalUrl(businessData?.detail.placeUrl),
      toExternalUrl(businessData?.detail.menuLink),
    ].filter(Boolean) as string[];
    const deduped = Array.from(new Set(urls));
    return deduped.length > 0 ? deduped : undefined;
  }, [businessData]);

  const jsonLd =
    parsed.kind === "business" && businessData
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: businessData.detail.name,
          description: businessData.detail.description ?? pageDescription,
          url: businessData.canonical.canonicalPath,
          telephone: businessData.detail.phone ?? undefined,
          address: businessData.detail.address ?? undefined,
          sameAs,
          hasMap: toExternalUrl(businessData.detail.placeUrl) ?? undefined,
          aggregateRating:
            businessData.detail.rating != null
              ? {
                  "@type": "AggregateRating",
                  ratingValue: businessData.detail.rating,
                  reviewCount: businessData.detail.totalReviews ?? 0,
                }
              : undefined,
          openingHoursSpecification,
          review: schemaReviews,
          geo:
            businessData.detail.latitude != null &&
            businessData.detail.longitude != null
              ? {
                  "@type": "GeoCoordinates",
                  latitude: businessData.detail.latitude,
                  longitude: businessData.detail.longitude,
                }
              : undefined,
          image: mediaUrls.slice(0, 12),
        }
      : {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: pageTitle,
          description: pageDescription,
          url: pageUrl,
        };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: b.label,
      item: b.href,
    })),
  };

  const onSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewMessage(null);
    setReviewSubmitting(true);

    try {
      const token = getAuthToken();
      const apiBaseUrl = getApiBaseUrl();
      const res = await axios.post(
        `${apiBaseUrl}/api/reviews/business-token/${encodeURIComponent(businessData!.detail.businessToken)}`,
        { rating: reviewRating, title: reviewTitle, comment: reviewComment },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setReviewMessage(res.data?.message || "Review submitted successfully.");

      // Clear form and close after a delay
      setTimeout(() => {
        setShowReviewForm(false);
        setReviewMessage(null);
        setReviewTitle("");
        setReviewComment("");
        setReviewRating(5);
      }, 2000);
    } catch (err: any) {
      setReviewError(getApiErrorMessage(err, "Failed to submit review."));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const onRegisterForContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    const email = contactEmail.trim();
    if (!email || !contactPassword.trim()) {
      setContactError("Email and password are required.");
      return;
    }

    setContactLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const registerRes = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: contactPassword }),
      });
      if (!registerRes.ok) {
        throw new Error(
          await getApiErrorMessageFromResponse(
            registerRes,
            "Registration failed.",
          ),
        );
      }

      const loginRes = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: contactPassword }),
      });
      if (!loginRes.ok) {
        throw new Error(
          await getApiErrorMessageFromResponse(
            loginRes,
            "Registered but login failed. Please login manually.",
          ),
        );
      }
      const payload = (await loginRes.json()) as { access_token?: string };
      if (!payload.access_token) {
        throw new Error("Login token not received.");
      }
      if (typeof window !== "undefined") {
        setAuthTokenCookie(payload.access_token);
      }
      setContactUnlocked(true);
      setShowContactGate(false);
    } catch (error) {
      setContactError(
        error instanceof Error ? error.message : "Unable to register.",
      );
    } finally {
      setContactLoading(false);
    }
  };
  const socialImage =
    parsed.kind === "business"
      ? (visibleMediaUrls[0] ?? fallbackListThumb)
      : fallbackListThumb;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={dynamicKeywords} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta
          property="og:type"
          content={parsed.kind === "business" ? "business.business" : "website"}
        />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={socialImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={socialImage} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      </Head>

      <SiteShell>
        <nav aria-label="Breadcrumb" className="pub-breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href}>
              {index > 0 ? " / " : ""}
              {index === breadcrumbs.length - 1 ? (
                <span>{crumb.label}</span>
              ) : (
                <Link href={crumb.href}>{crumb.label}</Link>
              )}
            </span>
          ))}
        </nav>

        <section className="pub-hero">
          <h1 className="pub-title">{pageTitle}</h1>
          {parsed.kind === "business" &&
          hindiBusinessName &&
          !hindiBusinessName.includes(pageTitle) ? (
            <p className="pub-subtitle">{hindiBusinessName}</p>
          ) : null}
        </section>

        <SectionCard
          title={
            parsed.kind === "business" ? "Business Details" : "Search Results"
          }
        >
          {parsed.kind === "business" && businessData ? (
            <>
              <div
                className="pub-tab-row"
                role="tablist"
                aria-label="Business info tabs"
              >
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`pub-tab-btn ${activeTab === tab.id ? "is-active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="tab-icon">
                      {tab.id === "overview" && <Info size={16} />}
                      {tab.id === "about" && <Clock size={16} />}
                      {tab.id === "reviews" && <Star size={16} />}
                      {tab.id === "menu" && <MenuIcon size={16} />}
                      {tab.id === "gallery" && <ImageIcon size={16} />}
                    </span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" ? (
                <>
                  <BusinessCard
                    variant="list"
                    fallbackCategory={humanizeSlug(parsed.categorySlug)}
                    fallbackArea={effectiveAreaName}
                    fallbackCity={effectiveCityName}
                    business={{
                      businessToken: businessData.detail.businessToken,
                      name: businessData.detail.name,
                      description: businessData.detail.description,
                      address: businessData.detail.address,
                      rating: businessData.detail.rating,
                      totalReviews: businessData.detail.totalReviews,
                      canonicalPath: businessData.canonical.canonicalPath,
                      thumbnailUrl: visibleMediaUrls[0] ?? fallbackListThumb,
                    }}
                  />

                  {businessData.detail.phone ? (
                    <div className="pub-contact-panel">
                      <div className="contact-info-main">
                        <Phone size={20} className="text-muted" />
                        <span className="phone-number">
                          {contactUnlocked
                            ? businessData.detail.phone
                            : maskPhone(businessData.detail.phone)}
                        </span>
                      </div>
                      {contactUnlocked ? (
                        <div className="pub-contact-actions">
                          {whatsappLink(
                            businessData.detail.phone,
                            businessData.detail.name,
                          ) ? (
                            <a
                              className="pub-chip"
                              href={
                                whatsappLink(
                                  businessData.detail.phone,
                                  businessData.detail.name,
                                ) ?? "#"
                              }
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                          ) : null}
                          <a
                            className="pub-chip"
                            href={emailShareLink(businessData.detail)}
                          >
                            <Mail size={14} /> Share
                          </a>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="pub-inline-btn"
                          onClick={() => setShowContactGate(true)}
                        >
                          Contact
                        </button>
                      )}
                    </div>
                  ) : null}
                  {toExternalUrl(businessData.detail.websiteLink) ? (
                    <p>
                      Website:{" "}
                      <a
                        style={{ overflowWrap: "anywhere" }}
                        href={
                          toExternalUrl(businessData.detail.websiteLink) ?? "#"
                        }
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {toExternalUrl(businessData.detail.websiteLink)}
                      </a>
                    </p>
                  ) : null}

                  {generatedNarrative ? (
                    <div className="pub-hours-block">
                      <h3>Business Overview</h3>
                      <p className="pub-muted">{generatedNarrative}</p>
                    </div>
                  ) : null}
                  {businessData.ownerProfile?.about ? (
                    <div>
                      <h3>Owner Updates</h3>
                      <p className="pub-muted">
                        {businessData.ownerProfile.about}
                      </p>
                      {businessData.ownerProfile.services?.length ? (
                        <p>
                          <strong>Services:</strong>{" "}
                          {businessData.ownerProfile.services.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="pub-contact-actions">
                    {isStrictUser && (
                      <a
                        className="pub-ad-btn"
                        style={{
                          background: "#f59e0b",
                          borderColor: "#f59e0b",
                        }}
                        onClick={() => {
                          if (contactUnlocked) {
                            setShowReviewForm(true);
                          } else {
                            setAuthGatePurpose("review");
                            setShowContactGate(true);
                          }
                        }}
                      >
                        <Star size={16} /> Submit Rating
                      </a>
                    )}
                    <a
                      className="pub-ad-btn"
                      href={`/claims?businessToken=${encodeURIComponent(businessData.detail.businessToken)}`}
                    >
                      Own this listing
                    </a>
                    <a
                      className="pub-ad-btn"
                      href={`/owner/listing?businessToken=${encodeURIComponent(businessData.detail.businessToken)}`}
                    >
                      Manage as owner
                    </a>
                  </div>
                </>
              ) : null}

              {activeTab === "about" ? (
                <>
                  {aboutItems.length > 0 ? (
                    <div>
                      {!hideBusinessInfoHeading ? <h3>Business Info</h3> : null}
                      <div className="pub-facts-grid">
                        {aboutItems.slice(0, 24).map((item, index) => {
                          const key = item.Key ?? item.key ?? "Info";
                          const showKey = shouldDisplayAboutKey(key);
                          const values = (
                            item.Value ??
                            item.value ??
                            []
                          ).filter(
                            (entry) => !shouldHideAboutEntry(key, entry),
                          );
                          return (
                            <div key={`${key}-${index}`} className="pub-fact">
                              {showKey ? <strong>{key}</strong> : null}
                              <div className="pub-muted">
                                {values.length === 0
                                  ? "-"
                                  : values.map((entry, valueIndex) => {
                                      const part = splitLabelAndValue(entry);
                                      return (
                                        <span
                                          key={`${key}-${index}-${valueIndex}`}
                                        >
                                          {valueIndex > 0 ? ", " : ""}
                                          {part.label ? (
                                            <strong>{part.label}: </strong>
                                          ) : null}
                                          {part.value}
                                        </span>
                                      );
                                    })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="pub-muted">
                      No additional business information available.
                    </p>
                  )}
                  {hoursGroups.length > 0 ? (
                    <div>
                      <h3>Business Hours</h3>
                      {hoursGroups.map((group, index) => {
                        const hours = group.Hours ?? group.hours ?? [];
                        if (hours.length === 0) return null;
                        const groupTitle = (
                          group.Category ??
                          group.category ??
                          ""
                        ).trim();
                        const showGroupTitle =
                          groupTitle.length > 0 &&
                          groupTitle.toLowerCase() !== "more";
                        return (
                          <div
                            key={`${groupTitle || "hours"}-${index}`}
                            className="pub-hours-block"
                          >
                            {showGroupTitle ? (
                              <strong>{groupTitle}</strong>
                            ) : null}
                            <table className="pub-hours-table">
                              <tbody>
                                {hours.map((row, rowIndex) => (
                                  <tr
                                    key={`${(row as any).Day ?? row.day ?? "day"}-${rowIndex}`}
                                  >
                                    <td>
                                      {
                                        ((row as any).Day ??
                                          getDayNameOnly(row.day ?? "") ??
                                          "Day") as string
                                      }
                                      :{" "}
                                    </td>
                                    <td>
                                      {(row as any).Time ?? row.time ?? "N/A"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : null}

              {activeTab === "reviews" ? (
                <>
                  {scrapedReviews.length > 0 ? (
                    <div>
                      <h3>Customer Highlights</h3>
                      <div className="pub-review-list">
                        {(showAllScrapedReviews
                          ? scrapedReviews
                          : scrapedReviews.slice(0, 4)
                        ).map((review, index) => (
                          <article
                            key={`${review.Reviewer ?? review.reviewer ?? "reviewer"}-${index}`}
                            className="pub-review-card"
                          >
                            <div>
                              <strong>
                                {review.Reviewer ??
                                  review.reviewer ??
                                  "Customer"}
                              </strong>
                              {" | "}
                              <span>
                                {toStars(
                                  review.Rating ?? review.rating ?? null,
                                )}
                              </span>
                              {review.Rating != null ||
                              review.rating != null ? (
                                <span className="pub-muted">
                                  {" "}
                                  (
                                  {(
                                    review.Rating ??
                                    review.rating ??
                                    0
                                  ).toFixed(1)}
                                  )
                                </span>
                              ) : null}
                            </div>
                            <p className="pub-muted">
                              {stripHtml(review.Text ?? review.text)}
                            </p>
                          </article>
                        ))}
                      </div>
                      {scrapedReviews.length > 4 ? (
                        <button
                          type="button"
                          className="pub-inline-btn"
                          onClick={() => setShowAllScrapedReviews((v) => !v)}
                        >
                          {showAllScrapedReviews
                            ? "Show less reviews"
                            : `Show more reviews (${scrapedReviews.length - 4} more)`}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {businessData.reviews?.length ? (
                    <div>
                      <h3>Approved Reviews</h3>
                      <ul
                        className="pub-review-list"
                        style={{ listStyle: "none", padding: 0 }}
                      >
                        {(showAllApprovedReviews
                          ? businessData.reviews
                          : businessData.reviews.slice(0, 4)
                        ).map((review, index) => (
                          <li key={`${review.createdAt}-${index}`}>
                            <strong>{toStars(review.rating)}</strong>{" "}
                            <span className="pub-muted">
                              ({review.rating.toFixed(1)})
                            </span>
                            {review.title ? ` - ${review.title}` : ""}
                            <div className="pub-muted">{review.comment}</div>
                          </li>
                        ))}
                      </ul>
                      {businessData.reviews.length > 4 ? (
                        <button
                          type="button"
                          className="pub-inline-btn"
                          onClick={() => setShowAllApprovedReviews((v) => !v)}
                        >
                          {showAllApprovedReviews
                            ? "Show less approved reviews"
                            : `Show more approved reviews (${businessData.reviews.length - 4} more)`}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="pub-muted">No approved reviews yet.</p>
                  )}
                  {isStrictUser && (
                    <p style={{ marginTop: 20 }}>
                      <button
                        type="button"
                        className="btn-link"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "var(--teal-600)",
                          cursor: "pointer",
                          textDecoration: "underline",
                          fontWeight: 600,
                        }}
                        onClick={() => {
                          if (contactUnlocked) {
                            setShowReviewForm(true);
                          } else {
                            setAuthGatePurpose("review");
                            setShowContactGate(true);
                          }
                        }}
                      >
                        Write a review
                      </button>
                    </p>
                  )}
                </>
              ) : null}

              {activeTab === "menu" && hasMenuItems ? (
                <>
                  {toExternalUrl(businessData.detail.menuLink) ? (
                    <p>
                      Full menu:{" "}
                      <a
                        href={
                          toExternalUrl(businessData.detail.menuLink) ?? "#"
                        }
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Open menu link
                      </a>
                    </p>
                  ) : null}
                  <div className="pub-menu-list">
                    {menuSections.map((section, sectionIndex) => (
                      <article
                        key={`menu-section-${section.title}-${sectionIndex}`}
                        className="pub-menu-item"
                      >
                        <div className="pub-menu-header">
                          <h3>{section.title}</h3>
                          <span className="pub-menu-count">
                            {section.items.length} items
                          </span>
                        </div>
                        {section.items.every(
                          (item) => !item.priceText && !item.description,
                        ) ? (
                          <div className="pub-menu-chips">
                            {section.items.map((item, itemIndex) => (
                              <span
                                key={`menu-chip-${sectionIndex}-${itemIndex}`}
                                className="pub-menu-chip"
                              >
                                {item.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <ul className="pub-menu-items">
                            {section.items.map((item, itemIndex) => (
                              <li
                                key={`menu-item-${sectionIndex}-${itemIndex}`}
                                className="pub-menu-row"
                              >
                                <div className="pub-menu-row-top">
                                  <span className="pub-menu-name">
                                    {item.name}
                                  </span>
                                  {item.priceText ? (
                                    <span className="pub-menu-price">
                                      {item.priceText}
                                    </span>
                                  ) : null}
                                </div>
                                {item.description ? (
                                  <div className="pub-menu-desc pub-muted">
                                    {item.description}
                                  </div>
                                ) : item.detail ? (
                                  <div className="pub-menu-desc pub-muted">
                                    {item.detail}
                                  </div>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              ) : null}

              {activeTab === "gallery" ? (
                <>
                  {visibleMediaUrls.length > 0 ? (
                    <section className="pub-showcase">
                      <button
                        type="button"
                        className="pub-showcase-main"
                        onClick={() => {
                          setLightboxIndex(0);
                          setLightboxOpen(true);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={visibleMediaUrls[0]}
                          alt={`${businessData.detail.name} featured photo`}
                          onError={() =>
                            setFailedMediaUrls((prev) =>
                              prev.includes(visibleMediaUrls[0])
                                ? prev
                                : [...prev, visibleMediaUrls[0]],
                            )
                          }
                        />
                      </button>
                      <div className="pub-showcase-side">
                        {visibleMediaUrls.slice(1, 5).map((src, index) => (
                          <button
                            key={`${src}-${index}`}
                            type="button"
                            className="pub-showcase-thumb"
                            onClick={() => {
                              setLightboxIndex(index + 1);
                              setLightboxOpen(true);
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={`${businessData.detail.name} gallery ${index + 2}`}
                              loading="lazy"
                              onError={() =>
                                setFailedMediaUrls((prev) =>
                                  prev.includes(src) ? prev : [...prev, src],
                                )
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <p className="pub-muted">
                      Photo gallery is not available for this business.
                    </p>
                  )}
                </>
              ) : null}
              {activeTab === "overview" &&
              businessData.activePromotions?.length ? (
                <div>
                  <h3>Promotions</h3>
                  <ul>
                    {businessData.activePromotions.map((promo, index) => (
                      <li key={`${promo.type}-${promo.endsAt}-${index}`}>
                        <strong>{promo.type}</strong> until{" "}
                        {new Date(promo.endsAt).toLocaleDateString()}
                        {promo.targetUrl ? (
                          <>
                            {" "}
                            <a
                              href={promo.targetUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Visit
                            </a>
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : apiData ? (
            <>
              <p>
                Found <strong>{apiData.pagination.totalCount}</strong> listings.
              </p>
              {apiData.items.length === 0 ? (
                <div>
                  <p className="pub-muted">
                    No listings currently. This page stays crawlable and will
                    auto-fill as data grows. Explore related links below.
                  </p>
                  {links ? <SeoLinkSections links={links} /> : null}
                </div>
              ) : (
                <div className="pub-list-results">
                  {apiData.items.map((item, index) => {
                    const card = (
                      <BusinessCard
                        key={item.businessToken}
                        variant="list"
                        fallbackCategory={humanizeSlug(parsed.categorySlug)}
                        fallbackArea={effectiveAreaName}
                        fallbackCity={effectiveCityName}
                        business={{
                          ...item,
                          thumbnailUrl:
                            item.thumbnailUrl ??
                            item.thumbUrl ??
                            item.imageUrl ??
                            item.photoUrl ??
                            fallbackListThumb,
                        }}
                      />
                    );
                    if (index !== 2) return card;
                    return (
                      <div key={`${item.businessToken}-with-ad`}>{card}</div>
                    );
                  })}
                </div>
              )}
              {apiData.items.length > 0 ? (
                <AdRequestCard
                  title="Advertise in this area"
                  subtitle="Reach customers searching in this neighborhood right now."
                  ctaLabel="Request a slot"
                />
              ) : null}
              {totalPages > 1 ? (
                <nav className="pub-pagination" aria-label="Pagination">
                  {currentPage > 1 ? (
                    <a
                      className="pub-page-link"
                      href={
                        currentPage - 1 === 1
                          ? pageBase
                          : `${pageBase}?page=${currentPage - 1}`
                      }
                    >
                      Previous
                    </a>
                  ) : null}
                  <span className="pub-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  {currentPage < totalPages ? (
                    <a
                      className="pub-page-link"
                      href={`${pageBase}?page=${currentPage + 1}`}
                    >
                      Next
                    </a>
                  ) : null}
                </nav>
              ) : null}
            </>
          ) : (
            <p className="pub-muted">
              No backend data resolved for this route yet.
            </p>
          )}
        </SectionCard>

        {generatedSearchLinks.length > 0 ? (
          <SectionCard title="Popular Searches">
            <div className="pub-chip-list">
              {(showMoreGeneratedSearches
                ? generatedSearchLinks
                : generatedSearchLinks.slice(0, 10)
              ).map((item) => (
                <Link
                  className="pub-chip"
                  key={`generated-${item.href}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {generatedSearchLinks.length > 10 ? (
              <button
                type="button"
                className="pub-inline-btn"
                onClick={() => setShowMoreGeneratedSearches((v) => !v)}
              >
                {showMoreGeneratedSearches
                  ? "Show less links"
                  : `Show more links (${generatedSearchLinks.length - 10} more)`}
              </button>
            ) : null}
          </SectionCard>
        ) : null}

        {links ? (
          <>
            {" "}
            <SectionCard title="You might interested in">
              <SeoLinkSections links={links} />
            </SectionCard>
          </>
        ) : null}
      </SiteShell>
      {lightboxOpen && visibleMediaUrls.length > 0 ? (
        <div
          className="pub-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Business gallery image viewer"
        >
          <button
            type="button"
            className="pub-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close gallery"
          >
            Close
          </button>
          <button
            type="button"
            className="pub-lightbox-nav prev"
            onClick={() =>
              setLightboxIndex((idx) =>
                idx <= 0 ? visibleMediaUrls.length - 1 : idx - 1,
              )
            }
            aria-label="Previous image"
          >
            Prev
          </button>
          <div className="pub-lightbox-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={visibleMediaUrls[lightboxIndex]}
              alt={`${businessData?.detail?.name ?? "Business"} image ${lightboxIndex + 1}`}
              onError={() =>
                setFailedMediaUrls((prev) =>
                  prev.includes(visibleMediaUrls[lightboxIndex])
                    ? prev
                    : [...prev, visibleMediaUrls[lightboxIndex]],
                )
              }
            />
          </div>
          <button
            type="button"
            className="pub-lightbox-nav next"
            onClick={() =>
              setLightboxIndex((idx) =>
                idx >= visibleMediaUrls.length - 1 ? 0 : idx + 1,
              )
            }
            aria-label="Next image"
          >
            Next
          </button>
          <div className="pub-lightbox-counter">
            {lightboxIndex + 1} / {visibleMediaUrls.length}
          </div>
        </div>
      ) : null}
      {showContactGate ? (
        <div
          className="pub-contact-gate"
          role="dialog"
          aria-modal="true"
          aria-label="Register to view contact"
        >
          <div className="pub-contact-card">
            <h3>Register to View Contact</h3>
            <p className="pub-muted">
              Create a normal user account with minimum information to access
              contact details.
            </p>
            <form onSubmit={onRegisterForContact}>
              <label className="pub-sr-only" htmlFor="contact-email">
                Email
              </label>
              <input
                id="contact-email"
                className="pub-search-input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <label className="pub-sr-only" htmlFor="contact-password">
                Password
              </label>
              <div className="form-field" style={{ marginTop: 8 }}>
                <input
                  id="contact-password"
                  className="pub-search-input form-input-password"
                  type={contactPasswordVisible ? "text" : "password"}
                  value={contactPassword}
                  onChange={(e) => setContactPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setContactPasswordVisible((v) => !v)}
                  aria-label={
                    contactPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {contactPasswordVisible ? "Hide" : "Show"}
                </button>
              </div>
              {contactError ? (
                <p
                  className="pub-muted"
                  style={{ color: "#b91c1c", whiteSpace: "pre-line" }}
                >
                  {contactError}
                </p>
              ) : null}
              <div className="pub-contact-actions" style={{ marginTop: 10 }}>
                <button
                  type="submit"
                  className="pub-search-btn"
                  disabled={contactLoading}
                >
                  {contactLoading ? "Please wait..." : "Register & Continue"}
                </button>
                <button
                  type="button"
                  className="pub-inline-btn"
                  onClick={() => setShowContactGate(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showReviewForm ? (
        <div className="pub-contact-gate" role="dialog" aria-modal="true">
          <div
            className="pub-contact-card"
            style={{ width: "min(520px, 100%)" }}
          >
            <div className="pub-modal-header">
              <h3>Submit Review</h3>
              <p className="pub-muted">
                Share your experience with {effectiveBusinessName}
              </p>
            </div>

            {reviewMessage && (
              <div className="form-alert is-success">
                <CheckCircle2 size={18} />
                <span>{reviewMessage}</span>
              </div>
            )}

            {reviewError && (
              <div className="form-alert is-error">
                <AlertCircle size={18} />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={onSubmitReview} className="auth-form">
              <div className="form-row">
                <label>Rating</label>
                <div
                  className="pub-stars-wrap"
                  style={{
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={28}
                      className={
                        star <= reviewRating ? "star-filled" : "star-empty"
                      }
                      onClick={() => setReviewRating(star)}
                      fill={star <= reviewRating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="rev-title">Headline</label>
                <input
                  id="rev-title"
                  className="form-input"
                  placeholder="Summarize your visit"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="rev-comment">Review Details</label>
                <textarea
                  id="rev-comment"
                  className="form-textarea"
                  placeholder="What did you like or dislike?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  style={{ minHeight: 120 }}
                />
              </div>

              <div className="pub-contact-actions" style={{ marginTop: 10 }}>
                <button
                  type="submit"
                  className="pub-search-btn"
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? "Submitting..." : "Post Review"}
                </button>
                <button
                  type="button"
                  className="pub-inline-btn"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const raw = context.params?.seo;
  const segments = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? [raw]
      : [];
  const parsed = parseSeoSegments(segments);
  if (!parsed) {
    return { notFound: true };
  }

  const canonicalPath = buildCanonicalPath(parsed);
  const apiBaseUrl = getApiBaseUrl();
  const authToken =
    getAuthTokenFromCookieHeader(context.req.headers.cookie) ?? undefined;
  const currentPageRaw =
    typeof context.query.page === "string"
      ? Number.parseInt(context.query.page, 10)
      : 1;
  const currentPage =
    Number.isFinite(currentPageRaw) && currentPageRaw > 0 ? currentPageRaw : 1;

  if (parsed.legacy && parsed.kind !== "business") {
    const destination =
      currentPage > 1 ? `${canonicalPath}?page=${currentPage}` : canonicalPath;
    return {
      redirect: {
        destination,
        permanent: true,
      },
    };
  }

  if (parsed.kind === "business") {
    const businessToken = tryExtractBusinessToken(
      parsed.businessComposite ?? "",
    );
    const legacyCid = businessToken
      ? null
      : tryExtractLegacyCid(parsed.businessComposite ?? "");
    const canonicalData = businessToken
      ? await fetchBusinessCanonical(apiBaseUrl, businessToken, authToken)
      : legacyCid
        ? await fetchBusinessCanonicalByCid(apiBaseUrl, legacyCid, authToken)
        : null;
    if (!canonicalData) {
      return { notFound: true };
    }

    if (canonicalData.canonicalPath !== canonicalPath) {
      return {
        redirect: {
          destination: canonicalData.canonicalPath,
          permanent: true,
        },
      };
    }
  }

  const apiPath = buildApiPath(parsed, currentPage);
  const apiData = apiPath
    ? await fetchSearchData(apiBaseUrl, apiPath, authToken)
    : null;
  let businessData: BusinessApiResponse | null = null;
  if (parsed.kind === "business") {
    const businessToken = tryExtractBusinessToken(
      parsed.businessComposite ?? "",
    );
    const legacyCid = businessToken
      ? null
      : tryExtractLegacyCid(parsed.businessComposite ?? "");
    if (businessToken) {
      businessData = await fetchBusinessData(
        apiBaseUrl,
        businessToken,
        authToken,
      );
    } else if (legacyCid) {
      const canonicalData = await fetchBusinessCanonicalByCid(
        apiBaseUrl,
        legacyCid,
        authToken,
      );
      if (canonicalData?.businessToken) {
        businessData = await fetchBusinessData(
          apiBaseUrl,
          canonicalData.businessToken,
          authToken,
        );
      }
    }
  }

  return {
    props: {
      parsed,
      canonicalPath,
      apiData,
      businessData,
      currentPage,
    },
  };
};

function buildApiPath(
  parsed: ParsedSeoRoute,
  currentPage: number,
): string | null {
  const pageQuery = currentPage > 1 ? `?page=${currentPage}` : "";
  if (parsed.kind === "city") {
    return `/api/public-search/city/${encodeURIComponent(parsed.citySlug)}${pageQuery}`;
  }

  if (parsed.kind === "cityArea") {
    return `/api/public-search/city/${encodeURIComponent(parsed.citySlug)}/area/${encodeURIComponent(parsed.areaSlug ?? "")}${pageQuery}`;
  }

  if (parsed.kind === "cityCategory") {
    return `/api/public-search/city/${encodeURIComponent(parsed.citySlug)}/category/${encodeURIComponent(parsed.categorySlug ?? "")}${pageQuery}`;
  }

  if (parsed.kind === "cityAreaCategory") {
    return `/api/public-search/city/${encodeURIComponent(parsed.citySlug)}/area/${encodeURIComponent(parsed.areaSlug ?? "")}/category/${encodeURIComponent(parsed.categorySlug ?? "")}${pageQuery}`;
  }

  if (parsed.kind === "cityAreaPlaceType") {
    return `/api/public-search/city/${encodeURIComponent(parsed.citySlug)}/area/${encodeURIComponent(parsed.areaSlug ?? "")}/place-type/${encodeURIComponent(parsed.placeTypeSlug ?? "")}${pageQuery}`;
  }

  if (parsed.kind === "cityAreaPlaceTypePlace") {
    return `/api/public-search/city/${encodeURIComponent(parsed.citySlug)}/area/${encodeURIComponent(parsed.areaSlug ?? "")}/place-type/${encodeURIComponent(parsed.placeTypeSlug ?? "")}/place/${encodeURIComponent(parsed.placeSlug ?? "")}${pageQuery}`;
  }

  return null;
}

function tryExtractBusinessToken(businessComposite: string): string | null {
  const normalized = businessComposite.trim();
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/-b([a-f0-9]{20,})$/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function tryExtractLegacyCid(businessComposite: string): string | null {
  const normalized = businessComposite.trim();
  if (!normalized) return null;
  const lowered = normalized.toLowerCase();

  const googleCidMarker = "-google-cid:";
  const googleCidIndex = lowered.lastIndexOf(googleCidMarker);
  if (googleCidIndex >= 0) {
    return lowered.slice(googleCidIndex + 1);
  }

  const pieces = lowered.split("-").filter(Boolean);
  if (pieces.length === 0) return null;

  const last = pieces[pieces.length - 1] ?? null;
  if (!last) return null;

  const maybeGoogleCidTail = pieces.slice(-2).join("-");
  if (/^0x[0-9a-f]+-0x[0-9a-f]+$/.test(maybeGoogleCidTail)) {
    return `google-cid:${maybeGoogleCidTail.replace("-", ":")}`;
  }

  return last;
}

function buildBreadcrumbs(
  parsed: ParsedSeoRoute,
  options?: {
    citySlug?: string;
    areaSlug?: string;
    cityName?: string;
    areaName?: string;
    businessName?: string;
  },
): Array<{ label: string; href: string }> {
  const citySlug = options?.citySlug ?? parsed.citySlug;
  const areaSlug = options?.areaSlug ?? parsed.areaSlug;
  const cityName = options?.cityName ?? humanizeSlug(citySlug);
  const areaName =
    options?.areaName ?? (areaSlug ? humanizeSlug(areaSlug) : undefined);
  const crumbs: Array<{ label: string; href: string }> = [
    { label: "Home", href: "/" },
  ];
  crumbs.push({ label: cityName, href: `/c-${citySlug}` });

  if (areaSlug) {
    crumbs.push({
      label: areaName ?? humanizeSlug(areaSlug),
      href: `/c-${citySlug}/a-${areaSlug}`,
    });
  }

  if (parsed.kind === "business") {
    crumbs.push({
      label: options?.businessName ?? "Business",
      href: buildCanonicalPath(parsed),
    });
    return crumbs;
  }

  if (parsed.categorySlug) {
    crumbs.push({
      label: humanizeSlug(parsed.categorySlug),
      href: `/c-${citySlug}/k-${parsed.categorySlug}`,
    });
  }

  if (parsed.placeTypeSlug) {
    crumbs.push({
      label: humanizeSlug(parsed.placeTypeSlug),
      href: `/c-${citySlug}/a-${areaSlug}/t-${parsed.placeTypeSlug}`,
    });
  }

  if (parsed.placeSlug) {
    crumbs.push({
      label: humanizeSlug(parsed.placeSlug),
      href: `/c-${citySlug}/a-${areaSlug}/t-${parsed.placeTypeSlug}/p-${parsed.placeSlug}`,
    });
  }

  return crumbs;
}

function humanizeSlug(value?: string): string {
  if (!value) {
    return "";
  }

  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
