import Link from "next/link";
import SiteShell from "../components/public/SiteShell";
import SectionCard from "../components/public/SectionCard";
import AdRequestCard from "../components/public/AdRequestCard";

export default function NotFoundPage() {
  return (
    <SiteShell>
      <SectionCard title="Page Not Found">
        <p>
          We could not find the page you were looking for. It might have been
          moved, renamed, or removed.
        </p>
        <p>
          Try returning to the homepage or explore popular sections of
          LocalOnline.
        </p>
        <div className="auth-links">
          <Link className="btn btn-ghost" href="/">
            Home
          </Link>
          <Link className="btn btn-ghost" href="/search">
            Search
          </Link>
          <Link className="btn btn-ghost" href="/about">
            About
          </Link>
        </div>
      </SectionCard>
      {/* @ts-ignore */}
      <AdRequestCard
        variant="banner"
        title="Advertise Here"
        subtitle="Promote your business on LocalOnline."
        ctaLabel="Send request"
      />
    </SiteShell>
  );
}
