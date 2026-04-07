import Link from "next/link";
import SiteShell from "../components/public/SiteShell";
import SectionCard from "../components/public/SectionCard";

export default function PrivacyPage() {
  return (
    <SiteShell>
      <SectionCard title="Privacy Policy">
        <p>
          <b>Goal:</b> To inform users how you handle their data, especially for
          "Click-to-Call" features.
        </p>
        <p>
          <b>I. Data Collection</b>
          <br />
          <b>For Users:</b> We collect basic info (IP address, location) and any
          data provided during registration (Name, Email, Mobile).
          <br />
          <b>For Businesses:</b> We collect GST details (if applicable), shop
          address, contact numbers, and images.
        </p>
        <p>
          <b>II. Usage of Data</b>
          <br />
          <b>Lead Tracking: </b>When a user clicks "View Phone Number," we may
          log this action to provide analytics to the business owner (e.g., "You
          received 10 inquiries from Gaur City 1 this week").
          <b>Communication: </b>
          <br /> We may use your email to send updates about local deals or
          service alerts in Greater Noida West, Crossing Republik, and Gaur
          City. You can opt out of these communications at any time.
        </p>
        <p>
          <b>III. Cookies & Location</b>
          <br />
          We use cookies to remember your preferred location (e.g., Crossing
          Republik) so you don't have to select it every time you visit. <br />
          We use Google Analytics to track site performance.
        </p>
        <p>
          <b>IV. Data Sharing</b>
          <br />
          We do not sell user personal data to third-party telemarketers.
          <br />
          Data is only shared with listed businesses when a user explicitly
          submits a "Request a Quote" or "Contact" form.
        </p>
      </SectionCard>
      <SectionCard title="Claim This Business / Edit Policy">
        <p>
          Since your site allows the community to "Suggest an Edit," you need a
          small clause for this:
          <br />
          "To maintain data integrity, all community-suggested edits (phone
          number changes, address updates) undergo a manual or automated
          verification process before going live. The verified business owner
          has the final authority over their listing details."
        </p>
      </SectionCard>
    </SiteShell>
  );
}
