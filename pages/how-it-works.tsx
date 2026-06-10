import Head from "next/head";
import SiteShell from "../components/public/SiteShell";
import SectionCard from "../components/public/SectionCard";
import {
  Search,
  MapPin,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
  Phone,
  CheckCircle,
  Store,
} from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <>
      <Head>
        <title>How It Works | LocalOnline - Your Neighborhood Guide</title>
        <meta
          name="description"
          content="Learn how to navigate LocalOnline to find shops, services, and utilities in Noida Extension, Crossing Republik, and Gaur City."
        />
      </Head>
      <SiteShell>
        <section className="pub-hero">
          <h1 className="pub-title">How LocalOnline Works</h1>
          <p className="pub-subtitle">
            Connecting neighbors with trusted local businesses in just a few
            clicks.
          </p>
        </section>

        <SectionCard title="For Residents & Shoppers">
          <div className="how-it-works-grid">
            <div className="step-item">
              <div className="step-header">
                <div className="step-icon-box">
                  <Search size={24} />
                </div>
                <h3>1. Smart Search</h3>
              </div>
              <p className="pub-muted">
                Start by selecting your city. Use the search bar to find
                anything from "Best South Indian Food" to "Reliable
                Electrician". Our search is optimized to understand societies
                like Gaur City, Mahagun Mascot, and specific local plazas.
              </p>
            </div>

            <div className="step-item">
              <div className="step-header">
                <div className="step-icon-box">
                  <MapPin size={24} />
                </div>
                <h3>2. Hyper-Local Results</h3>
              </div>
              <p className="pub-muted">
                Unlike global search engines, we prioritize businesses located
                within your immediate vicinity. You can see how close a shop is
                to your society gates or local marketplace, ensuring
                convenience.
              </p>
            </div>

            <div className="step-item">
              <div className="step-header">
                <div className="step-icon-box">
                  <ShieldCheck size={24} />
                </div>
                <h3>3. Detailed Profiles</h3>
              </div>
              <p className="pub-muted">
                Click on a business to see verified contact numbers, operating
                hours, service lists, and even food menus. Read authentic
                reviews from neighbors who have actually used the service.
              </p>
            </div>

            <div className="step-item">
              <div className="step-header">
                <div className="step-icon-box">
                  <MessageCircle size={24} />
                </div>
                <h3>4. Connect Directly</h3>
              </div>
              <p className="pub-muted">
                Found what you need? Use our one-tap buttons to Call or WhatsApp
                the business owner directly. No middlemen, no hidden fees—just
                direct local commerce at your fingertips.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="For Business Owners">
          <div className="pub-grid-2">
            <div>
              <h3>Step 1: Create Your Digital Identity</h3>
              <p className="pub-muted">
                Sign up as an owner and search for your existing listing. If
                it's not there, use the "Add Listing" button to create a new
                storefront. It takes less than 2 minutes to get started.
              </p>
              <Link
                href="/owner/listing"
                className="btn btn-primary"
                style={{
                  marginTop: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Store size={16} style={{ marginRight: "8px" }} /> Add Your
                Business
              </Link>
            </div>
            <div>
              <h3>Step 2: Verify Ownership</h3>
              <p className="pub-muted">
                To protect your business data, we require a simple verification.
                Upload a document (GST, Utility Bill, or Shop License) to claim
                your listing and unlock management features.
              </p>
              <Link
                href="/claims"
                className="btn btn-ghost"
                style={{
                  marginTop: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <CheckCircle size={16} style={{ marginRight: "8px" }} /> Start
                Verification
              </Link>
            </div>
            <div>
              <h3>Step 3: Enrich Your Profile</h3>
              <p className="pub-muted">
                Add high-quality photos, list your specific services (e.g.,
                "Home Delivery Available"), and keep your timing updated.
                Businesses with complete profiles receive significantly more
                inquiries.
              </p>
            </div>
            <div>
              <h3>Step 4: Engage & Grow</h3>
              <p className="pub-muted">
                Respond to customer reviews and track how many residents are
                viewing your profile. Use our advertising tools to appear at the
                top of searches in your specific neighborhood.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Our Verification Process">
          <div className="verification-info">
            <p>
              At <strong>LocalOnline</strong>, trust is our priority. Listings
              marked with a{" "}
              <span style={{ color: "var(--emerald)", fontWeight: 700 }}>
                Verified
              </span>{" "}
              badge have undergone our multi-step check:
            </p>
            <ul
              className="pub-muted"
              style={{
                listStyleType: "disc",
                paddingLeft: "20px",
                marginTop: "10px",
              }}
            >
              <li>
                Document Check: Ensuring the business is legally registered.
              </li>
              <li>
                Location Check: Confirming the physical presence of the shop or
                service.
              </li>
              <li>
                Contact Check: Verifying that the phone numbers provided are
                active and belong to the legitimate owner.
              </li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Common Questions">
          <div className="pub-faq-list">
            <article className="pub-faq-item">
              <h3>Is it free to list my business?</h3>
              <p className="pub-muted">
                Basic listing on LocalOnline is free. We want to support every
                local vendor in the neighborhood. We offer premium plans for
                those who want advanced visibility and features.
              </p>
            </article>
            <article className="pub-faq-item">
              <h3>How do I write a review?</h3>
              <p className="pub-muted">
                To maintain quality, you need to be a registered user to submit
                a review. Simply log in, visit the business page, and click
                "Submit Rating" or "Write a Review".
              </p>
            </article>
            <article className="pub-faq-item">
              <h3>I found a mistake in a listing, what should I do?</h3>
              <p className="pub-muted">
                Registered users can suggest edits on any business profile. Our
                team reviews these suggestions periodically to ensure the
                directory remains accurate.
              </p>
            </article>
          </div>
        </SectionCard>

        <style jsx>{`
          .how-it-works-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 30px;
            margin-top: 20px;
          }
          .step-item {
            padding: 20px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            border: 1px solid var(--border);
          }
          .step-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
          }
          .step-icon-box {
            background: var(--marigold);
            color: #000;
            padding: 10px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .step-header h3 {
            margin: 0;
            font-size: 1.25rem;
          }
        `}</style>
      </SiteShell>
    </>
  );
}
