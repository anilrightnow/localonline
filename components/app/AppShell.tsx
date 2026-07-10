import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import {
  clearAuthTokenCookie,
  getAuthToken,
  useRequireAuth,
} from "../../lib/auth";
import { apiFetch } from "../../lib/apiClient";
import { getUserSessionFromToken, hasRole } from "../../lib/session";
import TopProgress from "../shared/TopProgress";
import AdminLayout, { AdminNavItem } from "../../AdminLayout";
import {
   BadgeDollarSign,
   BarChart3,
   Building2,
   CalendarDays,
   ClipboardCheck,
   Database,
   FileText,
   Gavel,
   Import,
   Image,
   LayoutDashboard,
   Megaphone,
   Settings,
   ShieldCheck,
   UserCog,
   Users,
  } from "lucide-react";

export type RoleRequirement = "Admin" | "SuperAdmin";

type AppShellProps = {
  title: string;
  subtitle?: string;
  requiredRole?: RoleRequirement;
  children: ReactNode;
};

type NavItem = AdminNavItem;

const USER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  //{ href: "/claims", label: "Claims", icon: ClipboardCheck },
  { href: "/reviews", label: "Reviews", icon: FileText },
  //{ href: "/owner/listing", label: "Owner Listing", icon: Building2 },
  //{ href: "/community/events", label: "Events", icon: CalendarDays },
  //{ href: "/community/societies", label: "Societies", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];
const OWNER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/claims", label: "Claims", icon: ClipboardCheck },
  //{ href: "/reviews", label: "Reviews", icon: FileText },
  { href: "/owner/listing", label: "Owner Listing", icon: Building2 },
  //{ href: "/community/events", label: "Events", icon: CalendarDays },
  //{ href: "/community/societies", label: "Societies", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];
const ADMIN_NAV: NavItem[] = [
   { href: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
   { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
   {
     href: "/admin/subscriptions",
     label: "Subscriptions",
     icon: BadgeDollarSign,
   },
   { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
   { href: "/admin/ad-requests", label: "Ad Requests", icon: ClipboardCheck },
   { href: "/admin/listing-updates", label: "Listing Updates", icon: FileText },
   { href: "/admin/business-images", label: "Business Images", icon: Image },
   { href: "/admin/scraped-businesses", label: "Scraped Businesses", icon: Database },
   { href: "/admin/moderation", label: "Moderation", icon: Gavel },
   { href: "/admin/users", label: "Users", icon: Users },
   { href: "/admin/roles", label: "Roles", icon: UserCog },
 ];

const SUPERADMIN_NAV: NavItem[] = [
  {
    href: "/superadmin/settings",
    label: "SuperAdmin Settings",
    icon: Settings,
  },
  { href: "/superadmin/users", label: "User Management", icon: Users },
  { href: "/superadmin/roles", label: "Role Management", icon: ShieldCheck },
  {
    label: "Data Import",
    href: "/admin/import-sql",
    icon: Import,
  },
];

export default function AppShell({
  title,
  subtitle,
  requiredRole,
  children,
}: AppShellProps) {
  const router = useRouter();
  const { isChecking, isAuthenticated } = useRequireAuth();
  const session = useMemo(() => getUserSessionFromToken(getAuthToken()), []);
  const isAdmin = hasRole(session, "Admin");
  const isSuperAdmin = hasRole(session, "SuperAdmin");
  const isOwner = session.roles.includes("Owner");
  const roleLabel = isSuperAdmin
    ? "SuperAdmin"
    : isAdmin
      ? "Admin"
      : isOwner
        ? "Owner"
        : "User";
  const displayName = session.email ?? "Signed in";

  let nav = [...USER_NAV];
  if (isOwner) nav = [...OWNER_NAV];
  if (isAdmin) nav = [...ADMIN_NAV];
  if (isSuperAdmin) nav = [...ADMIN_NAV, ...SUPERADMIN_NAV];

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
      <>
        <TopProgress />
        <AdminLayout
          userRole={roleLabel}
          userName={displayName}
          navItems={nav}
          title="Access denied"
          subtitle="You do not have permission to open this section."
          onLogout={onLogout}
        >
          <section className="app-card">
            <div className="app-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => router.push("/profile")}
              >
                Go to profile
              </button>
            </div>
          </section>
        </AdminLayout>
      </>
    );
  }

  return (
    <>
      <TopProgress />
      <AdminLayout
        userRole={roleLabel}
        userName={displayName}
        navItems={nav}
        title={title}
        subtitle={subtitle}
        onLogout={onLogout}
      >
        {children}
      </AdminLayout>
    </>
  );
}
