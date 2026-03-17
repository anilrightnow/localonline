import Head from "next/head";
import SiteShell from "../components/public/SiteShell";
import SectionCard from "../components/public/SectionCard";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About LocalOnline</title>
        <meta
          name="description"
          content="Learn about LocalOnline, how local businesses and customers benefit, and the key platform features."
        />
        <link rel="canonical" href="/about" />
      </Head>
      <SiteShell>
        <section className="pub-hero">
          <h1 className="pub-title">About LocalOnline</h1>
          <p className="pub-subtitle">
            LocalOnline is building an online market for local businesses so nearby customers can discover, compare, and connect faster.
          </p>
        </section>

        <SectionCard title="Why LocalOnline">
          <div className="pub-grid-2">
            <p className="pub-muted">We help local businesses become discoverable online with structured profiles and search-friendly pages.</p>
            <p className="pub-muted">We help customers find trusted nearby services by city, area, and category in a few clicks.</p>
          </div>
        </SectionCard>

        <SectionCard title="Benefits for Businesses">
          <ul>
            <li>Increase visibility in local search pages and category listings.</li>
            <li>Claim and manage your listing with profile updates and media.</li>
            <li>Build trust through ratings, reviews, and complete information.</li>
            <li>Promote offers and stay visible in your local market.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Benefits for Customers">
          <ul>
            <li>Search businesses by city, area, and category quickly.</li>
            <li>Compare options with ratings, reviews, and business details.</li>
            <li>Get direct contact options with verified listing data.</li>
            <li>Discover local events and communities in one place.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Key Features">
          <ul>
            <li>SEO-friendly location and business pages.</li>
            <li>Global city-based search with suggestions.</li>
            <li>Business claim and owner listing management.</li>
            <li>Reviews, promotions, local events, and societies.</li>
          </ul>
        </SectionCard>
      </SiteShell>
    </>
  );
}
