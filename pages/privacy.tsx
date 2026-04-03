import Link from "next/link";
import SiteShell from "../components/public/SiteShell";
import SectionCard from "../components/public/SectionCard";

export default function PrivacyPage() {
  return (
    <SiteShell>
      <SectionCard title="Privacy Policy">
        <p>
          LocalOnline respects your privacy. We collect only the information needed to
          provide our services, such as account details and activity data related to
          listings, reviews, and community features.
        </p>
        <p>
          We use cookies for authentication and session management. We do not sell
          your personal data. Data may be shared with trusted service providers only
          when required to operate the platform.
        </p>
        <p>
          If you have questions or want to request data removal, contact us at{" "}
          <a href="mailto:support@localonline.in">support@localonline.in</a>.
        </p>
        <div className="auth-links">
          <Link className="btn btn-ghost" href="/terms">Terms</Link>
          <Link className="btn btn-ghost" href="/about">About</Link>
        </div>
      </SectionCard>
    </SiteShell>
  );
}
