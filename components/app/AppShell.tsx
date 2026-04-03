import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useMemo, useState } from "react";
import { clearAuthTokenCookie, getAuthToken, useRequireAuth } from "../../lib/auth";
import { apiFetch } from "../../lib/apiClient";
import { getUserSessionFromToken, hasRole } from "../../lib/session";
import TopProgress from "../shared/TopProgress";

type RoleRequirement = "Admin" | "SuperAdmin";

type AppShellProps = {
  title: string;
  subtitle?: string;
  requiredRole?: RoleRequirement;
  children: ReactNode;
};

type NavItem = { href: string; label: string };

const USER_NAV: NavItem[] = [
  { href: "/profile", label: "Profile" },
  { href: "/plans", label: "Plans" },
  { href: "/claims", label: "Claims" },
  { href: "/reviews", label: "Reviews" },
  { href: "/owner/listing", label: "Owner Listing" },
  { href: "/community/events", label: "Events" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Admin Dashboard" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/ad-requests", label: "Ad Requests" },
  { href: "/admin/listing-updates", label: "Listing Updates" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/roles", label: "Roles" },
];

const SUPERADMIN_NAV: NavItem[] = [
  { href: "/superadmin/settings", label: "SuperAdmin Settings" },
  { href: "/superadmin/users", label: "User Management" },
  { href: "/superadmin/roles", label: "Role Management" },
];

export default function AppShell({ title, subtitle, requiredRole, children }: AppShellProps) {
  const router = useRouter();
  const { isChecking, isAuthenticated } = useRequireAuth();
  const session = useMemo(() => getUserSessionFromToken(getAuthToken()), []);
  const isAdmin = hasRole(session, "Admin");
  const isSuperAdmin = hasRole(session, "SuperAdmin");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const roleLabel = isSuperAdmin ? "SuperAdmin" : isAdmin ? "Admin" : "User";
  const displayName = session.email ?? "Signed in";
  const initials = displayName
    .split("@")[0]
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const nav = [
    ...USER_NAV,
    ...(isAdmin ? ADMIN_NAV : []),
    ...(isSuperAdmin ? SUPERADMIN_NAV : []),
  ];
  const roleDenied = requiredRole ? !hasRole(session, requiredRole) : false;

  async function onLogout() {
    if (typeof window === "undefined") return;
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors and continue client-side cleanup.
    }
    clearAuthTokenCookie();
    window.location.href = router.asPath || "/";
  }

  if (isChecking || !isAuthenticated) {
    return (
      <>
        <TopProgress />
        <div className="app-loading">Loading workspace...</div>
      </>
    );
  }

  if (roleDenied) {
    return (
      <main className="app-main">
        <section className="app-card">
          <h1 className="app-title">Access denied</h1>
          <p className="app-subtitle">You do not have permission to open this section.</p>
          <div className="app-actions">
            <Link className="btn btn-primary" href="/profile">
              Go to profile
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <TopProgress />
      <aside className="app-sidebar">
        <Link href="/" className="app-logo">
          LocalOnline
        </Link>
        <p className="app-nav-section">Main Menu</p>
        <nav className="app-nav">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`app-nav-link${router.pathname === item.href ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <h1 className="app-title">{title}</h1>
            {subtitle ? <p className="app-subtitle">{subtitle}</p> : null}
          </div>
          <div className="app-topbar-right">
            <div className="app-search">
              <span className="app-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input className="app-search-input" placeholder="Search anything..." />
            </div>
            <button className="app-icon-btn" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3a6 6 0 016 6v3.5l1.5 2.5H4.5L6 12.5V9a6 6 0 016-6z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M9.5 19a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <div className="app-user">
              <button
                className="app-user-trigger"
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <div className="app-avatar">{initials || "U"}</div>
                <div className="app-user-meta">
                  <span className="app-user-name">{displayName}</span>
                  <span className="app-user-role">{roleLabel}</span>
                </div>
                <span className="app-caret" aria-hidden="true">▾</span>
              </button>
              {userMenuOpen ? (
                <div className="app-user-menu">
                  <Link className="app-user-menu-link" href="/profile">View profile</Link>
                  <Link className="app-user-menu-link" href="/plans">Account settings</Link>
                  <button className="app-user-menu-link" type="button" onClick={onLogout}>
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <section className="app-content">{children}</section>
      </main>
    </div>
  );
}
