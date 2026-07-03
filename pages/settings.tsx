import Link from "next/link";
import AppShell from "../components/app/AppShell";

const settingsCards = [
  {
    title: "Profile",
    description:
      "Update your personal details, contact email, and profile information.",
    href: "/profile",
    action: "Update profile",
  },
  {
    title: "Plan & Billing",
    description:
      "Upgrade your plan, review invoices, and manage subscription settings.",
    href: "/promote-your-business",
    action: "Upgrade plan",
  },
  {
    title: "Password",
    description: "Change your account password and keep your login secure.",
    href: "/auth/forgot-password",
    action: "Change password",
  },
  {
    title: "Two-Factor Authentication",
    description: "Set up or refresh your 2FA security settings.",
    href: "/auth/2fa-setup",
    action: "Manage 2FA",
  },
];

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      subtitle="All account options live here: profile, security, and subscription changes."
    >
      <div className="app-grid">
        {settingsCards.map((card) => (
          <section className="app-card" key={card.title}>
            <h3 style={{ marginTop: 0 }}>{card.title}</h3>
            <p className="app-subtitle" style={{ marginBottom: "14px" }}>
              {card.description}
            </p>
            <Link className="btn btn-primary" href={card.href}>
              {card.action}
            </Link>
          </section>
        ))}
      </div>

      <section className="app-card" style={{ marginTop: "16px" }}>
        <h3 style={{ marginTop: 0 }}>Account Preferences</h3>
        <div className="app-grid">
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>
              Email Notifications
            </p>
            <p style={{ margin: 0, color: "#64748b" }}>
              Configure marketing and product update emails in your profile
              settings.
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Security Logs</p>
            <p style={{ margin: 0, color: "#64748b" }}>
              Review login activity from the security section of your account.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
