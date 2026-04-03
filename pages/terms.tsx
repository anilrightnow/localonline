import Link from "next/link";
import SiteShell from "../components/public/SiteShell";
import SectionCard from "../components/public/SectionCard";

export default function TermsPage() {
  return (
    <SiteShell>
      <SectionCard title="Terms of Service">
        <p>
          By using LocalOnline, you agree to provide accurate information and
          follow local laws and platform guidelines. Listings, claims, and reviews
          must be truthful and respectful.
        </p>
        <p>
          We may review, moderate, or remove content that violates these terms.
          Continued use of the platform indicates acceptance of updates to these
          terms as we improve our services.
        </p>
        <p>
          For questions, contact{" "}
          <a href="mailto:support@localonline.in">support@localonline.in</a>.
        </p>
        <div className="auth-links">
          <Link className="btn btn-ghost" href="/privacy">Privacy</Link>
          <Link className="btn btn-ghost" href="/about">About</Link>
        </div>
      </SectionCard>
    </SiteShell>
  );
}
