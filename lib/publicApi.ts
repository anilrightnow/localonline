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
  description?: string | null;
  address?: string | null;
  rating?: number | null;
  isVerified?: boolean | null;
  totalReviews?: number | null;
  canonicalPath: string;
  thumbnailUrl?: string | null;
  thumbUrl?: string | null;
  imageUrl?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
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
    isVerified?: boolean | null;
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

export type SitemapResponse = {
body: string;
}

export type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string | null;
  authorName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = BlogPostSummary & {
  content: string;
};

export type BlogListResponse = {
  items: BlogPostSummary[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
  };
};

export type BlogSitemapCountResponse = {
  totalCount: number;
  shardSize: number;
  shardCount: number;
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!isRetriableStatus(response.status) || attempt >= retries) {
        return response;
      }
    } catch (err) {
      if (attempt >= retries) throw err;
    } finally {
      clearTimeout(timeout);
    }
    attempt += 1;
    await sleep(350 * attempt);
  }
}

async function fetchJson<T>(
  url: string,
  options?: { authToken?: string },
): Promise<T | null> {
  const { getAuthToken } = await import("./auth");
  const clientToken = typeof window !== "undefined" ? getAuthToken() : null;
  const authToken = options?.authToken ?? clientToken;
  if (typeof window === "undefined") {
    const { getServiceToken } = await import("./serviceAuth");
    const apiBaseUrl = getApiBaseUrl();
    let token = authToken ?? null;
    if (!token) {
      try {
        token = await getServiceToken(apiBaseUrl);
      } catch {
        token = null;
      }
    }
    let response: Response;
    try {
      response = await fetchWithRetry(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {
      return null;
    }
    if (!response.ok) return null;
    return (await response.json()) as T;
  }
  notifyLoading(true);
  try {
    let response: Response;
    try {
      response = await fetchWithRetry(url, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
    } catch {
      return null;
    }
    if (!response.ok) return null;
    return (await response.json()) as T;
  } finally {
    notifyLoading(false);
  }
}

export async function fetchHomeData(apiBaseUrl: string, authToken?: string) {
  return fetchJson<HomeApiResponse>(`${apiBaseUrl}/api/public-search/home`, {
    authToken,
  });
}

export async function fetchBusinessCanonical(
  apiBaseUrl: string,
  businessToken: string,
  authToken?: string,
) {
  return fetchJson<CanonicalBusinessResponse>(
    `${apiBaseUrl}/api/public-search/business-token/${encodeURIComponent(businessToken)}/canonical`,
    { authToken },
  );
}

export async function fetchBusinessCanonicalByCid(
  apiBaseUrl: string,
  cid: string,
  authToken?: string,
) {
  return fetchJson<CanonicalBusinessResponse>(
    `${apiBaseUrl}/api/public-search/business/${encodeURIComponent(cid)}/canonical`,
    { authToken },
  );
}

export async function fetchBusinessData(
  apiBaseUrl: string,
  businessToken: string,
  authToken?: string,
) {
  return fetchJson<BusinessApiResponse>(
    `${apiBaseUrl}/api/public-search/business-token/${encodeURIComponent(businessToken)}`,
    { authToken },
  );
}

export async function fetchSearchData(
  apiBaseUrl: string,
  apiPath: string,
  authToken?: string,
) {
  return fetchJson<SearchApiResponse>(`${apiBaseUrl}${apiPath}`, { authToken });
}

export async function fetchSitemapData(
  apiBaseUrl: string,
  siteMapPath: string,
  authToken?: string,
) {
  return fetchJson<SitemapResponse>(`${apiBaseUrl}/${siteMapPath}`, {
    authToken,
  });
}

export async function fetchBlogPosts(apiBaseUrl: string, page = 1, limit = 12) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return fetchJson<BlogListResponse>(`${apiBaseUrl}/api/blogs?${params}`);
}

export async function fetchBlogPost(apiBaseUrl: string, slug: string) {
  return fetchJson<BlogPost>(
    `${apiBaseUrl}/api/blogs/${encodeURIComponent(slug)}`,
  );
}

export async function fetchBlogSitemapCount(apiBaseUrl: string) {
  return fetchJson<BlogSitemapCountResponse>(
    `${apiBaseUrl}/api/blogs/sitemap-count`,
  );
}
