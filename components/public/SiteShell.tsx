import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import GlobalSearch from "./GlobalSearch";
import { getApiBaseUrl } from "../../lib/publicApi";
import TopProgress from "../shared/TopProgress";
import { clearAuthTokenCookie, getAuthToken } from "../../lib/auth";
import { apiFetch } from "../../lib/apiClient";
import { getUserSessionFromToken } from "../../lib/session";

type SiteShellProps = {
  children: ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [siteVisitors, setSiteVisitors] = useState<number | null>(null);
  const [siteName, setSiteName] = useState("LocalOnline");
  const [supportEmail, setSupportEmail] = useState<string | null>(
    "support@localonline.in",
  );
  const token = typeof window !== "undefined" ? getAuthToken() : null;
  const session = useMemo(() => getUserSessionFromToken(token), [token]);
  const isLoggedIn = Boolean(session.userId || session.email);

  useEffect(() => {
    setIsClient(true);
    document.body.classList.toggle("theme-dark", darkMode);
    return () => document.body.classList.remove("theme-dark");
  }, [darkMode]);

  async function onLogout() {
    if (typeof window === "undefined") return;
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best-effort logout
    }
    clearAuthTokenCookie();
    window.location.href = router.asPath || "/";
  }

  useEffect(() => {
    let mounted = true;
    const apiBaseUrl = getApiBaseUrl();
    const token = getAuthToken();
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : undefined;

    fetch(`${apiBaseUrl}/api/analytics/site/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        const total = Number(data.totalVisits);
        if (!Number.isNaN(total)) setSiteVisitors(total);
      })
      .catch(() => null);
    fetch(`${apiBaseUrl}/api/public/settings`, { headers: authHeaders })
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
      <TopProgress />
      <header className="pub-header">
        <div className="pub-container pub-header-inner">
          <Link href="/" className="pub-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/local-online-logo.svg"
              alt="Local Online"
              className="pub-brand-logo"
            />
            <span className="pub-sr-only">{siteName}</span>
          </Link>
          <nav id="pub-main-nav" className="pub-nav" aria-label="Primary">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/claims">Claim</Link>
            <Link href="/owner/listing">Add Listing</Link>
            <Link href="/reviews">Reviews</Link>
            <Link href="/community/events">Events</Link>
            {isClient && isLoggedIn ? (
              <>
                {session.email === "user@test.local" ? (
                  <Link href="/profile">Dashboard</Link>
                ) : null}
                <button
                  type="button"
                  className="pub-theme-btn"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/auth/login">Login</Link>
            )}
            <button
              type="button"
              className="pub-theme-btn"
              onClick={() => setDarkMode((v) => !v)}
            >
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
          <div className="pub-footer-inner">
            <div className="pub-footer-brand">
              <p className="pub-footer-title">{siteName}</p>
              <p className="pub-footer-text">
                Your online market for local businesses.
              </p>
              {supportEmail ? (
                <a className="pub-footer-link" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              ) : null}
            </div>
            <div className="pub-footer-links">
              <p className="pub-footer-title">Company</p>
              <Link className="pub-footer-link" href="/about">
                About
              </Link>
              <Link className="pub-footer-link" href="/privacy">
                Privacy
              </Link>
              <Link className="pub-footer-link" href="/terms">
                Terms
              </Link>
            </div>
            <div className="pub-footer-links">
              <p className="pub-footer-title">Explore</p>
              <Link className="pub-footer-link" href="/claims">
                Claim Listing
              </Link>
              <Link className="pub-footer-link" href="/owner/listing">
                Add Listing
              </Link>
              <Link className="pub-footer-link" href="/community/events">
                Community Events
              </Link>
            </div>
          </div>
          <p className="pub-footer-meta">
            © {new Date().getFullYear()} LocalOnline. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
