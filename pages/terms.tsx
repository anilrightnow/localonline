import Link from "next/link";
import SiteShell from "../components/public/SiteShell";
import SectionCard from "../components/public/SectionCard";

export default function TermsPage() {
  return (
    <SiteShell>
      <SectionCard title="Terms & Conditions (T&C)">
        <p>
          <b>Goal:</b> To define the rules for using the site and limit your
          liability for business interactions.
        </p>
        <p>
          <b>I. Acceptance of Terms </b>
          <br />
          By accessing localOnline, users and business owners agree to comply
          with these terms. We reserve the right to modify these at any time.
        </p>
        <p>
          <b>II. Service Scope</b>
          <br />
          <b>Directory Only: </b>localOnline is a listing platform. We do not
          provide the services listed (e.g., plumbing, food). Any contract or
          dispute is strictly between the user and the business owner.
          <b>Accuracy: </b>
          <br /> While we strive for accuracy in Crossing Republik and Gaur City
          listings, we do not guarantee that business hours, addresses, or
          prices are always up-to-date.
        </p>
        <p>
          <b>III. User Conduct & Reviews</b>
          <br />
          Users must provide honest, non-defamatory reviews based on personal
          experience. <br />
          We reserve the right to remove "spam" or "fake" reviews intended to
          harm a competitor or artificially boost a rating.
        </p>
        <p>
          <b>IV. Business Owner Responsibilities</b>
          <br />
          <b>Ownership:</b> By "Claiming a Business," you represent that you are
          the authorized owner or agent.
          <br />
          <b>Content:</b> Owners are responsible for the photos and information
          they upload. No illegal or infringing content is allowed.
        </p>
        <p>
          <b>V. Limitation of Liability</b>
          <br />
          localOnline is not liable for any loss, injury, or poor service
          quality resulting from a business found on this platform.
          <br />
          We do not guarantee 100% website uptime.
        </p>
      </SectionCard>
    </SiteShell>
  );
}
