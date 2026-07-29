import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import Script from "next/script";
import { Fragment, useState } from "react";
import BusinessCard from "../components/public/BusinessCard";
import AdRequestCard from "../components/public/AdRequestCard";
import SectionCard from "../components/public/SectionCard";
import SeoLinkSections from "../components/public/SeoLinkSections";
import SiteShell from "../components/public/SiteShell";
import HomeCategoryLinks from "../components/public/HomeCategoryLinks";
import {
  fetchHomeData,
  getApiBaseUrl,
  type HomeApiResponse,
} from "../lib/publicApi";
import { getAuthTokenFromCookieHeader } from "../lib/authCookie";
import {
  Search,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";

type Props = {
  data: HomeApiResponse;
};

const fallbackData: HomeApiResponse = {
  seo: {
    title:
      "Local Businesses in Crossing Republik, Gaur City, Greater Noida West, Noida Extension & Shahberi | LocalOnline",
    h1: "Your Neighborhood, Just a Click Away",
    description:
      "Discover verified local businesses, shops, restaurants, and services in Crossing Republik, Gaur City, Greater Noida West, Noida Extension, and Shahberi. Find the best of Gautam Buddha Nagar and Ghaziabad with ratings, reviews, and contact details.",
    keywords:
      "Crossing Republik, Gaur City, Greater Noida West, Noida Extension, Shahberi, Gautam Buddha Nagar, Ghaziabad, local businesses, near me, restaurants, shops, services",
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
  const [heroMuted, setHeroMuted] = useState(true);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Local Online",
    url: data.seo.canonicalPath,
    description: data.seo.description,
    potentialAction: {
      "@type": "SearchAction",
      target: "/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://localonline.in"
  ).replace(/\/+$/, "");
  return (
    <>
      <Head>
        <title>{data.seo.title}</title>
        <meta name="description" content={data.seo.description} />
        {data.seo.keywords ? (
          <meta name="keywords" content={data.seo.keywords} />
        ) : null}
        <link rel="canonical" href={`${siteUrl}${data.seo.canonicalPath}`} />
        <meta property="og:title" content={data.seo.title} />
        <meta property="og:description" content={data.seo.description} />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`${siteUrl}${data.seo.canonicalPath}`}
        />
        <meta property="og:image" content="/local-online-logo.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/local-online-logo.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <SiteShell>
        <section className="pub-home-hero">
          {/* 1. The Background Video */}
          <video
            autoPlay
            loop
            muted={heroMuted}
            playsInline
            preload="none"
            className="pub-home-hero-video"
            poster="/ads_place_holder.jpg"
            controls={false}
            suppressHydrationWarning
            onClick={() => setHeroMuted(false)}
          >
            <source src="/uploads/localonline-banner.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <button
            type="button"
            className="pub-sound-toggle"
            onClick={() => setHeroMuted((m) => !m)}
            aria-label={heroMuted ? "Unmute video" : "Mute video"}
          >
            {heroMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* 
      Note: The dark overlay (::after) is automatically 
      applied via your index.css (lines 1838-1844).
  */}

          {/* 2. The Content Layer */}
          <div className="pub-container">
            <div className="pub-kicker">Empowering Local Markets</div>
            <h1 className="pub-title">{data.seo.h1}</h1>
            <p className="pub-subtitle">{data.seo.description}</p>

            <div className="pub-hero-chips">
              <a href="/owner/listing" className="pub-hero-chip">
                🚀 List Your Business
              </a>
              <a href="/promote-your-business" className="pub-hero-chip">
                🌟 Promote Your Business
              </a>
              <a href="#how-it-works" className="pub-hero-chip">
                💡 How it Works
              </a>
            </div>
          </div>
        </section>

        <section className="home-ad-banner">
          {/* @ts-ignore */}
          <AdRequestCard
            variant="banner"
            title="Grow Your Local Reach"
            subtitle="Promote your business to thousands of residents across Crossing Republik, Gaur City, Greater Noida West, Noida Extension, and Shahberi."
            ctaLabel="Advertise With Us"
            type="BannerHome"
          />
        </section>

        <SectionCard title="Explore Search Paths">
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

        <SectionCard
          title="How This Works"
          className="how-it-works"
          id="how-it-works"
        >
          <div className="container">
            <h2 className="section-title">
              Experience <span>LocalOnline</span>
            </h2>
            <p className="section-subtitle">
              Your simple 4-step guide to navigating the neighborhood.
            </p>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">01</div>
                <div className="step-icon">
                  <Search size={32} strokeWidth={1.5} />
                </div>
                <h3>Smart Search</h3>
                <p>
                  Search local businesses, shops, and services by city, area,
                  society, marketplace, or business category.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">02</div>
                <div className="step-icon">
                  <MapPin size={32} strokeWidth={1.5} />
                </div>
                <h3>Compare Local</h3>
                <p>
                  Browse relevant listings within your immediate area. View
                  ratings and proximity in one glance.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">03</div>
                <div className="step-icon">
                  <ShieldCheck size={32} strokeWidth={1.5} />
                </div>
                <h3>Verified Details</h3>
                <p>
                  Access deep-dive profiles with one-click calling, WhatsApp,
                  and authentic resident reviews.
                </p>
              </div>

              <div className="step-card highlight">
                <div className="step-number">04</div>
                <div className="step-icon">
                  <TrendingUp size={32} strokeWidth={1.5} />
                </div>
                <h3>Owner Hub</h3>
                <p>
                  Claim your business for free. Update your catalog and engage
                  directly with your neighbors.
                </p>
              </div>
            </div>

            <div
              className="pub-hero-chips"
              style={{ marginTop: "30px", justifyContent: "center" }}
            >
              <a href="/how-it-works" className="pub-hero-chip">
                💡 Read Full How-to Guide
              </a>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Featured Businesses">
          {data.featuredBusinesses.length === 0 ? (
            <p className="pub-muted">No featured businesses available yet.</p>
          ) : (
            <div className="pub-grid">
              {data.featuredBusinesses.map((biz, index) => (
                <Fragment key={biz.businessToken}>
                  <BusinessCard business={biz} />
                  {/* Insert ad banner after every 10th item */}
                  {(index + 1) % 10 === 0 && (
                    /* @ts-ignore */
                    <AdRequestCard
                      variant="sidebar"
                      title="Reach customers nearby"
                      subtitle="Promote your business here."
                      ctaLabel="Send request"
                      type="FeaturedList"
                    />
                  )}
                </Fragment>
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
        <SectionCard title="Frequently Asked Questions">
          <div className="pub-faq-list">
            <article className="pub-faq-item">
              <h3>How do I find businesses near my city or area?</h3>
              <p className="pub-muted">
                Select a city in the search bar, then search by category, area,
                society, landmark, or business name.
              </p>
            </article>
            <article className="pub-faq-item">
              <h3>Can I call or WhatsApp a business from LocalOnline?</h3>
              <p className="pub-muted">
                Yes. Business profiles show available contact actions such as
                call, WhatsApp, website, directions, and sharing.
              </p>
            </article>
            <article className="pub-faq-item">
              <h3>How can owners claim or update a listing?</h3>
              <p className="pub-muted">
                Owners can use Claim Listing or Add Listing to request access,
                update details, and submit changes for review.
              </p>
            </article>
            <article className="pub-faq-item">
              <h3>What cities and local categories are supported?</h3>
              <p className="pub-muted">
                LocalOnline supports city and category pages such as
                restaurants, salons, gyms, sabji mandi, and many neighborhood
                services.
              </p>
            </article>
          </div>
        </SectionCard>
      </SiteShell>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const apiBaseUrl = getApiBaseUrl();
  const authToken =
    getAuthTokenFromCookieHeader(context.req.headers.cookie) ?? undefined;
  const data = (await fetchHomeData(apiBaseUrl, authToken)) ?? fallbackData;
  return { props: { data } };
};
