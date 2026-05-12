import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import GlobalSearch from "./GlobalSearch";
import TopProgress from "../shared/TopProgress";
import { clearAuthTokenCookie, getAuthToken } from "../../lib/auth";
import { apiFetch } from "../../lib/apiClient";
import { getUserSessionFromToken } from "../../lib/session";
import { LogIn, LogOut, User, Sun, Moon, PlusCircle } from "lucide-react";

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
    const savedTheme = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="))
      ?.split("=")[1];
    setDarkMode(savedTheme === "dark");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", darkMode);
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `theme=${darkMode ? "dark" : "light"}; Path=/; Expires=${expires.toUTCString()}`;
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
    const token = getAuthToken();
    const requestInit = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;

    apiFetch("/api/analytics/site/summary", requestInit)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        const total = Number(data.totalVisits);
        if (!Number.isNaN(total)) setSiteVisitors(total);
      })
      .catch(() => null);
    apiFetch("/api/public/settings", requestInit)
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
            <Link href="/owner/listing" className="pub-nav-highlight">
              <PlusCircle size={16} /> Add Listing
            </Link>
            <Link href="/reviews">Reviews</Link>
            <Link href="/community/events">Events</Link>
            {isClient && isLoggedIn ? (
              <>
                {session.email === "user@test.local" ? (
                  <Link href="/profile">
                    <User size={16} /> Account
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="pub-nav-btn logout"
                  onClick={onLogout}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="pub-nav-btn login">
                <LogIn size={16} /> Login
              </Link>
            )}
            <button
              type="button"
              className="pub-theme-btn"
              onClick={() => setDarkMode((v) => !v)}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
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
