export type RelatedLink = {
  label: string;
  href: string;
};

export type RelatedLinks = {
  cities: RelatedLink[];
  areas: RelatedLink[];
  categories: RelatedLink[];
  placeTypes: RelatedLink[];
  places: RelatedLink[];
};

export type SearchBusinessItem = {
  businessToken: string;
  name: string;
  address?: string | null;
  rating?: number | null;
  totalReviews?: number | null;
  canonicalPath: string;
  thumbnailUrl?: string | null;
  thumbUrl?: string | null;
  imageUrl?: string | null;
  photoUrl?: string | null;
};

export type HomeApiResponse = {
  seo: {
    title: string;
    h1: string;
    description: string;
    canonicalPath: string;
  };
  topCities: RelatedLink[];
  topCategories: RelatedLink[];
  topAreas: RelatedLink[];
  topPlaceTypes: RelatedLink[];
  featuredBusinesses: SearchBusinessItem[];
};

export type SearchApiResponse = {
  seo: {
    title: string;
    description: string;
    canonicalPath: string;
    keywords?: string[];
  };
  queryContext?: {
    city?: { slug?: string; name?: string };
    area?: { slug?: string; name?: string; tags?: string[] };
    category?: { slug?: string; name?: string; tags?: string[] };
    placeType?: { slug?: string; name?: string; categorySlug?: string | null; categoryName?: string | null };
    place?: { slug?: string; name?: string; tags?: string[] };
  };
  pagination: {
    totalCount: number;
  };
  items: SearchBusinessItem[];
  relatedLinks: RelatedLinks;
};

export type CanonicalBusinessResponse = {
  businessToken: string;
  businessName?: string;
  citySlug?: string;
  cityName?: string;
  areaSlug?: string;
  areaName?: string;
  placeSlug?: string;
  canonicalPath: string;
};

export type BusinessApiResponse = {
  canonical: {
    businessName?: string;
    citySlug?: string;
    cityName?: string;
    areaSlug?: string;
    areaName?: string;
    placeSlug?: string;
    canonicalPath: string;
  };
  detail: {
    businessToken: string;
    cid?: string | null;
    name: string;
    name_hindi?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    websiteLink?: string | null;
    placeUrl?: string | null;
    menuLink?: string | null;
    description?: string | null;
    rating?: number | null;
    totalReviews?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    aboutJson?: string | null;
    businessHoursJson?: string | null;
    reviewJson?: string | null;
    mediaJson?: string | null;
    menuJson?: string | null;
    fullJson?: string | null;
  };
  reviews: Array<{
    rating: number;
    title: string;
    comment: string;
    createdAt: string;
  }>;
  ownerProfile?: {
    about?: string | null;
    services: string[];
    gallery: string[];
  } | null;
  activePromotions: Array<{
    type: string;
    bannerImageUrl?: string | null;
    targetUrl?: string | null;
    endsAt: string;
  }>;
  relatedLinks: RelatedLinks;
};

export function getApiBaseUrl() {
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
}

function isRetriableStatus(status: number) {
  return status === 500 || status === 502 || status === 503 || status === 504;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function notifyLoading(active: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app:loading", { detail: { active } }));
}

async function fetchWithRetry(url: string, init?: RequestInit, retries = 2) {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, init);
      if (!isRetriableStatus(response.status) || attempt >= retries) {
        return response;
      }
    } catch (err) {
      if (attempt >= retries) throw err;
    }
    attempt += 1;
    await sleep(350 * attempt);
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  if (typeof window === "undefined") {
    const { getServiceToken } = await import("./serviceAuth");
    const apiBaseUrl = getApiBaseUrl();
    const token = await getServiceToken(apiBaseUrl);
    const response = await fetchWithRetry(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  }
  notifyLoading(true);
  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } finally {
    notifyLoading(false);
  }
}

export async function fetchHomeData(apiBaseUrl: string) {
  return fetchJson<HomeApiResponse>(`${apiBaseUrl}/api/public-search/home`);
}

export async function fetchBusinessCanonical(apiBaseUrl: string, businessToken: string) {
  return fetchJson<CanonicalBusinessResponse>(`${apiBaseUrl}/api/public-search/business-token/${encodeURIComponent(businessToken)}/canonical`);
}

export async function fetchBusinessCanonicalByCid(apiBaseUrl: string, cid: string) {
  return fetchJson<CanonicalBusinessResponse>(`${apiBaseUrl}/api/public-search/business/${encodeURIComponent(cid)}/canonical`);
}

export async function fetchBusinessData(apiBaseUrl: string, businessToken: string) {
  return fetchJson<BusinessApiResponse>(`${apiBaseUrl}/api/public-search/business-token/${encodeURIComponent(businessToken)}`);
}

export async function fetchSearchData(apiBaseUrl: string, apiPath: string) {
  return fetchJson<SearchApiResponse>(`${apiBaseUrl}${apiPath}`);
}
