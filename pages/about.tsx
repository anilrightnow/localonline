import Head from "next/head";
import SiteShell from "../components/public/SiteShell";
import SectionCard from "../components/public/SectionCard";
import { MessageCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>
          About localOnline | Local Directory for Crossing Republik, Noida
          Extension, Greater Noida West & Gaur City
        </title>
        <meta
          name="description"
          content="Discover the best shops, services, and home utilities in Crossing Republik, Noida Extension, Greater Noida Westaur City, and Greater Noida West. Your hyper-local guide to Noida Extension."
        />
        <meta
          name="keywords"
          content="localOnline, local directory, Crossing Republik, Noida Extension, Greater Noida West, Gaur City, local businesses, hyper-local search, Crossing Republik local directory, shops in Gaur City, Noida Extension services, Mahagun Mascot shops, Gaur City 14th Avenue services, local search Ghaziabad."
        />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://localonline.in"}/about`} />
      </Head>
      <SiteShell>
        <section className="pub-hero">
          <h1 className="pub-title">
            About localOnline: Your Neighborhood, Digitized
          </h1>
          <p className="pub-subtitle">
            Welcome to localOnline, the definitive hyper-local business
            directory designed specifically for the vibrant townships of
            Crossing Republik, Gaur City, and Greater Noida West (Noida
            Extension).
          </p>
          <p>
            We aren't just another search engine. We are a community-driven
            bridge that connects residents with the shops, services, and hidden
            gems located right next door. Whether you are living in Mahagun
            Mascot, Ajnara Gen-X or the bustling avenues of Gaur City 1 & 2, we
            bring your entire marketplace to your fingertips.
          </p>
        </section>

        <SectionCard title="Why LocalOnline">
          <div className="pub-grid-2">
            <p className="pub-muted">
              Finding a reliable plumber, the best tiffin service, or a nearby
              preschool shouldn't feel like a chore. While global search engines
              give you broad results, localOnline gives you the "inside scoop"
              on what’s actually available within your specific society gates
              and local plazas like Galleria Market, City Plaza, and Orbit
              Plaza.
            </p>
            <ul>
              <li>
                Society-Specific Intelligence: Search for services that cater
                specifically to your apartment complex.
              </li>
              <li>
                Verified Local Listings: From AC repair in Gaur City to doctors
                in Crossing Republik, we prioritize verified and high-quality
                businesses.
              </li>
              <li>
                Real Resident Reviews: Read authentic feedback from your actual
                neighbors in Noida Extension.
              </li>
              <li>
                Support Local: We empower small business owners, home
                entrepreneurs, and local vendors by giving them a digital
                storefront to reach thousands of nearby residents.
              </li>
            </ul>
          </div>
        </SectionCard>
        <SectionCard title="Our Mission">
          <p>
            Our mission is to simplify urban living in the Greater Noida West
            region. We believe that a stronger connection between residents and
            local vendors leads to a more convenient, sustainable, and thriving
            neighborhood.
          </p>
          <p>
            Whether you need an emergency chemist open now, a top-rated gym, or
            the best dry cleaners in Crossing Republik, we ensure you spend less
            time searching and more time living.
          </p>
        </SectionCard>
        <SectionCard title="Are You a Business Owner?">
          <p>
            Grow your brand where it matters most. Join the hundreds of
            businesses in Gaur City, Noida Extension and Crossing Republik that
            use localOnline to reach their target audience.
          </p>
          <ul>
            <li>Claim your business to manage your profile.</li>
            <li>
              Feature your services to appear at the top of local searches.
            </li>
            <li>Engage with customers through reviews and direct inquiries.</li>
            <li>Promote offers and stay visible in your local market.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Benefits for Customers">
          <ul>
            <li>Search businesses by city, area, and category quickly.</li>
            <li>
              Compare options with ratings, reviews, and business details.
            </li>
            <li>Get direct contact options with verified listing data.</li>
            <li>Discover local events and communities in one place.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Contact Our Team">
          <p>
            Have questions or need assistance? Our support team is ready to help
            you navigate your neighborhood marketplace.
          </p>
          <ul>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:support@localonline.in">support@localonline.in</a>
            </li>
            <li>
              <strong>Phone:</strong>{" "}
              <a href="tel:+919268109317">+91 9268109317</a>
            </li>
            <li>
              <a
                href="https://wa.me/919268109317"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                style={{ display: "inline-flex", alignItems: "center" }}
              >
                <MessageCircle size={16} style={{ marginRight: "8px" }} />
                Chat on WhatsApp
              </a>
            </li>
          </ul>
          <p
            // Removed inline style and added class for styling
            className="contact-page-link"
          >
            You can also visit our{" "}
            <a href="/contact" style={{ fontWeight: 600 }}>
              Contact Us
            </a>{" "}
            page to send us a direct message.
          </p>
        </SectionCard>
        <style jsx>{`
          .contact-page-link {
            margin-top: 15px;
          }
        `}</style>
      </SiteShell>
    </>
  );
}
