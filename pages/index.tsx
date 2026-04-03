import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import BusinessCard from "../components/public/BusinessCard";
import AdRequestCard from "../components/public/AdRequestCard";
import SectionCard from "../components/public/SectionCard";
import SeoLinkSections from "../components/public/SeoLinkSections";
import SiteShell from "../components/public/SiteShell";
import {
  fetchHomeData,
  getApiBaseUrl,
  type HomeApiResponse,
} from "../lib/publicApi";
import { getAuthTokenFromCookieHeader } from "../lib/authCookie";

type Props = {
  data: HomeApiResponse;
};

const fallbackData: HomeApiResponse = {
  seo: {
    title: "LocalOnline - Online Market for Local Businesses",
    h1: "Discover Local Businesses on LocalOnline",
    description:
      "LocalOnline helps you find and compare businesses by city, area, category, and place.",
    canonicalPath: "/",
  },
  topCities: [],
  topCategories: [],
  topAreas: [],
  topPlaceTypes: [],
  featuredBusinesses: [],
};

export default function HomePage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LocalOnline",
    url: data.seo.canonicalPath,
    description: data.seo.description,
    potentialAction: {
      "@type": "SearchAction",
      target: "/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <Head>
        <title>{data.seo.title}</title>
        <meta name="description" content={data.seo.description} />
        <link rel="canonical" href={data.seo.canonicalPath} />
        <meta property="og:title" content={data.seo.title} />
        <meta property="og:description" content={data.seo.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={data.seo.canonicalPath} />
        <meta property="og:image" content="/local-online-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/local-online-logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <SiteShell>
        <section className="pub-hero">
          <h1 className="pub-title">{data.seo.h1}</h1>
          <p className="pub-subtitle">{data.seo.description}</p>
        </section>

        <SectionCard title="How This Works">
          <div className="pub-grid-2">
            <p className="pub-muted">
              1. Search by city, area, category, place type, or business name.
            </p>
            <p className="pub-muted">
              2. Open location pages and compare relevant listings.
            </p>
            <p className="pub-muted">
              3. Navigate to verified business details with all details.
            </p>
            <p className="pub-muted">
              4. Business owner can manage their listings and engage with
              customers for free.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Explore Local Search Paths">
          <SeoLinkSections
            links={{
              cities: data.topCities,
              categories: data.topCategories,
              areas: data.topAreas,
              placeTypes: data.topPlaceTypes,
              places: [],
            }}
          />
        </SectionCard>

        <SectionCard title="Advertise Here">
          <AdRequestCard
            title="Reach customers nearby"
            subtitle="Promote your business in front of local customers exploring these listings."
            ctaLabel="Send request"
          />
        </SectionCard>

        <SectionCard title="Featured Businesses">
          {data.featuredBusinesses.length === 0 ? (
            <p className="pub-muted">No featured businesses available yet.</p>
          ) : (
            <div className="pub-grid">
              {data.featuredBusinesses.map((biz) => (
                <BusinessCard key={biz.businessToken} business={biz} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="For Business Owners">
          <div className="pub-grid-2">
            <p className="pub-muted">
              Claim listing, enrich profile, and unlock management features with
              plans.
            </p>
            <p className="pub-muted">
              Track category/area visibility and improve discovery via
              structured listing data.
            </p>
          </div>
          <div className="pub-chip-list" style={{ marginTop: 10 }}>
            <Link className="pub-ad-btn" href="/claims">
              Claim Listing
            </Link>
            <Link className="pub-ad-btn" href="/owner/listing">
              Manage Listing
            </Link>
            <Link className="pub-ad-btn" href="/reviews">
              Write Review
            </Link>
            <Link className="pub-ad-btn" href="/community/events">
              Local Events
            </Link>
          </div>
        </SectionCard>
      </SiteShell>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const apiBaseUrl = getApiBaseUrl();
  const authToken = getAuthTokenFromCookieHeader(context.req.headers.cookie) ?? undefined;
  const data = (await fetchHomeData(apiBaseUrl, authToken)) ?? fallbackData;
  return { props: { data } };
};
