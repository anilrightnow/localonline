import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import BusinessCard from "../components/public/BusinessCard";
import SectionCard from "../components/public/SectionCard";
import SiteShell from "../components/public/SiteShell";
import { getApiBaseUrl } from "../lib/publicApi";
import { fetchWithServiceAuth } from "../lib/serviceAuth";
import { getAuthTokenFromCookieHeader } from "../lib/authCookie";

type SearchResponse = {
  query: { q: string; citySlug?: string | null };
  seo: { title: string; description: string; canonicalPath: string };
  pagination: { page: number; pageSize: number; totalCount: number };
  items: Array<{
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
  }>;
};

type Props = {
  data: SearchResponse;
};

export default function SearchPage({ data }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>{data.seo.title}</title>
        <meta name="description" content={data.seo.description} />
        <link rel="canonical" href={data.seo.canonicalPath} />
      </Head>
      <SiteShell>
        <SectionCard title="Search Results">
          <p className="pub-muted">
            Showing results for <strong>{data.query.q}</strong>
          </p>
          {data.items.length === 0 ? (
            <p className="pub-muted">No results found. Try a different search.</p>
          ) : (
            <div className="pub-list-results" style={{ marginTop: 12 }}>
              {data.items.map((item) => (
                <BusinessCard key={item.businessToken} variant="list" business={item} />
              ))}
            </div>
          )}
        </SectionCard>
      </SiteShell>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const q = typeof context.query.q === "string" ? context.query.q.trim() : "";
  const citySlug = typeof context.query.citySlug === "string" ? context.query.citySlug.trim() : "";
  const page = typeof context.query.page === "string" ? Number.parseInt(context.query.page, 10) : 1;
  const apiBaseUrl = getApiBaseUrl();
  const authToken = getAuthTokenFromCookieHeader(context.req.headers.cookie) ?? undefined;
  const params = new URLSearchParams();
  params.set("q", q);
  if (citySlug) params.set("citySlug", citySlug);
  if (Number.isFinite(page) && page > 1) params.set("page", String(page));
  const res = await fetchWithServiceAuth(
    apiBaseUrl,
    `${apiBaseUrl}/api/public-search/query?${params.toString()}`,
    undefined,
    authToken,
  );
  const data = res.ok ? ((await res.json()) as SearchResponse) : null;
  if (!data) {
    return {
      props: {
        data: {
          query: { q, citySlug },
          seo: {
            title: "Search results",
            description: "Search results",
            canonicalPath: `/search?q=${encodeURIComponent(q)}`,
          },
          pagination: { page: 1, pageSize: 20, totalCount: 0 },
          items: [],
        },
      },
    };
  }
  return { props: { data } };
};
