import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getUserSessionFromToken, hasRole } from "../../lib/session";

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

  const nav = [
    ...USER_NAV,
    ...(isAdmin ? ADMIN_NAV : []),
    ...(isSuperAdmin ? SUPERADMIN_NAV : []),
  ];
  const roleDenied = requiredRole ? !hasRole(session, requiredRole) : false;

  async function onLogout() {
    if (typeof window === "undefined") return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors and continue client-side cleanup.
    }
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    window.location.href = "/auth/login";
  }

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Loading workspace...</div>;
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
      <aside className="app-sidebar">
        <Link href="/" className="app-logo">
          LocalOnline
        </Link>
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
          <div>
            <h1 className="app-title">{title}</h1>
            {subtitle ? <p className="app-subtitle">{subtitle}</p> : null}
          </div>
          <div className="app-user">
            <span className="app-chip">{session.email ?? "Signed in"}</span>
            <span className="app-chip">{isSuperAdmin ? "SuperAdmin" : isAdmin ? "Admin" : "User"}</span>
            <button className="btn btn-ghost" onClick={onLogout} type="button">
              Logout
            </button>
          </div>
        </header>
        <section className="app-content">{children}</section>
      </main>
    </div>
  );
}
