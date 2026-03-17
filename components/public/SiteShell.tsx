import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import GlobalSearch from "./GlobalSearch";
import { getApiBaseUrl } from "../../lib/publicApi";

type SiteShellProps = {
  children: ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [siteVisitors, setSiteVisitors] = useState<number | null>(null);
  const [siteName, setSiteName] = useState("LocalOnline");
  const [supportEmail, setSupportEmail] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", darkMode);
    return () => document.body.classList.remove("theme-dark");
  }, [darkMode]);

  useEffect(() => {
    let mounted = true;
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/api/analytics/site/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        const total = Number(data.totalVisits);
        if (!Number.isNaN(total)) setSiteVisitors(total);
      })
      .catch(() => null);
    fetch(`${apiBaseUrl}/api/public/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        if (data.siteName) setSiteName(String(data.siteName));
        if (data.supportEmail) setSupportEmail(String(data.supportEmail));
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="pub-shell">
      <header className="pub-header">
        <div className="pub-container pub-header-inner">
          <Link href="/" className="pub-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-localonline.svg" alt={siteName} className="pub-brand-logo" />
            <span className="pub-sr-only">{siteName}</span>
          </Link>
          <nav id="pub-main-nav" className="pub-nav" aria-label="Primary">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/claims">Claim</Link>
            <Link href="/owner/listing">Owner</Link>
            <Link href="/reviews">Reviews</Link>
            <Link href="/community/events">Events</Link>
            <Link href="/auth/register">Register</Link>
            <button type="button" className="pub-theme-btn" onClick={() => setDarkMode((v) => !v)}>
              {darkMode ? "Light" : "Dark"}
            </button>
          </nav>
        </div>
      </header>
      <div className="pub-search-dock">
        <div className="pub-container">
          <GlobalSearch />
        </div>
      </div>

      <main className="pub-main pub-container">{children}</main>

      <footer className="pub-footer">
        <div className="pub-container">
          <p className="pub-footer-text">
            {siteName}: your online market for local businesses.
            {siteVisitors != null ? ` Site visitors: ${siteVisitors}.` : ""}
            {supportEmail ? ` Support: ${supportEmail}.` : ""}
          </p>
        </div>
      </footer>
    </div>
  );
}
