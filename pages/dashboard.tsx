import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import AppShell from "../components/app/AppShell";
import { useRequireAuth, getAuthToken } from "../lib/auth";
import { getUserSessionFromToken, hasRole } from "../lib/session";
import { apiUrl, apiFetch } from "../lib/apiClient";
import { getApiErrorMessage } from "../lib/apiError";
import {
  Activity as ActivityIcon,
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  LayoutGrid,
  LayoutDashboard,
  Mail,
  MessageSquare,
  RefreshCw,
  Star,
  Users,
  Zap,
} from "lucide-react";

type ActivityItem = {
  title: string;
  meta: string;
  link?: string;
  status?: "pending" | "approved" | "info";
};

type Kpi = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  href?: string;
  hint?: string;
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "activity">("overview");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [usage, setUsage] = useState<{
    value: number;
    limit: number;
    label: string;
  } | null>(null);
  const [quickActions, setQuickActions] = useState<
    Array<{ label: string; href: string; primary?: boolean }>
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const profileRes = await axios.get(apiUrl("/api/user/profile"), { headers });
      if (profileRes.data) {
        setEmailConfirmed(Boolean(profileRes.data.emailConfirmed));
      }
    } catch {
      setEmailConfirmed(null);
    }

    async function safeGet(path: string): Promise<any> {
      try {
        const res = await axios.get(apiUrl(path), { headers });
        return res.data;
      } catch {
        return null;
      }
    }

    try {
      if (isAdmin || isSuperAdmin) {
        const [data, claims, reviews, comm] = await Promise.all([
          safeGet("/api/admin/dashboard"),
          safeGet("/api/listing-claims/pending"),
          safeGet("/api/reviews/pending"),
          safeGet("/api/community/pending"),
        ]);
        const claimsArr = claims || [];
        const reviewsArr = reviews || [];
        const commObj = comm || { events: [], societies: [] };

        setKpis([
          { label: "Total Members", value: data?.memberCount ?? 0, icon: Users, accent: "#4338ca", href: "/admin/users", hint: "Manage members" },
          { label: "Pending Claims", value: claimsArr.length, icon: AlertCircle, accent: "#f59e0b", href: "/admin/listing-updates", hint: "Review claims" },
          { label: "Pending Reviews", value: reviewsArr.length, icon: MessageSquare, accent: "#10b981", href: "/admin/moderation", hint: "Moderate" },
          {
            label: "Pending Community",
            value: (commObj.events?.length || 0) + (commObj.societies?.length || 0),
            icon: LayoutGrid,
            accent: "#8b5cf6",
            href: "/admin/moderation",
            hint: "Approve posts",
          },
        ]);

        setUsage({
          value: 0,
          limit: Number(data?.monthlyLimit || 0),
          label: `${data?.planName || "N/A"} plan`,
        });

        setActivities([
          ...claimsArr.slice(0, 3).map((c: any) => ({
            title: `Claim: ${c.businessName || "Business"}`,
            meta: `By ${c.contactEmail || "—"} · ${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}`,
            link: "/admin/listing-updates",
            status: "pending" as const,
          })),
          ...reviewsArr.slice(0, 3).map((r: any) => ({
            title: `Review for ${r.businessName || "Business"}`,
            meta: `${r.rating ?? ""}★ · ${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}`,
            link: "/admin/moderation",
            status: "pending" as const,
          })),
          ...(commObj.events || []).slice(0, 2).map((e: any) => ({
            title: `Event: ${e.Title || e.title || "Event"}`,
            meta: `${e.CitySlug || e.city || ""} · ${e.CreatedAt ? new Date(e.CreatedAt).toLocaleDateString() : ""}`,
            link: "/admin/moderation",
            status: "info" as const,
          })),
        ]);

        setQuickActions(
          isSuperAdmin
            ? [
                { label: "Platform Settings", href: "/superadmin/settings", primary: true },
                { label: "User Management", href: "/superadmin/users" },
                { label: "Role Management", href: "/superadmin/roles" },
                { label: "Ad Requests", href: "/admin/ad-requests" },
              ]
            : [
                { label: "Moderate Listings", href: "/admin/listing-updates", primary: true },
                { label: "Users", href: "/admin/users" },
                { label: "Roles", href: "/admin/roles" },
                { label: "Analytics", href: "/admin/analytics" },
              ],
        );
      } else if (isOwner) {
        const [ownerListings, ownerClaims] = await Promise.all([
          safeGet("/api/owner-listings/mine"),
          safeGet("/api/listing-claims/mine"),
        ]);
        const listings: any[] = ownerListings || [];
        const claims: any[] = ownerClaims || [];

        setKpis([
          { label: "My Listings", value: listings.length, icon: Building2, accent: "#0f766e", href: "/owner/listing", hint: "Manage listings" },
          { label: "My Claims", value: claims.length, icon: FileText, accent: "#6366f1", href: "/claims", hint: "Track claims" },
          {
            label: "Reviews Received",
            value: listings.reduce((acc: number, b: any) => acc + (b.totalReviews || 0), 0),
            icon: Star,
            accent: "#f59e0b",
            href: "/reviews",
            hint: "See feedback",
          },
          { label: "Active Plan", value: listings[0]?.planName || "Free", icon: CheckCircle, accent: "#10b981", href: "/promote-your-business", hint: "Upgrade" },
        ]);

        setUsage({
          value: listings.length,
          limit: listings[0]?.planLimit ?? 5,
          label: "listings used",
        });

        setActivities(
          claims.slice(0, 5).map((c: any) => ({
            title: `Claim: ${c.businessName || "Business"}`,
            meta: `Status: ${c.status || "Submitted"}`,
            link: "/claims",
            status: (c.status === "Approved" ? "approved" : "pending") as any,
          })),
        );

        setQuickActions([
          { label: "Edit My Business", href: "/owner/listing", primary: true },
          { label: "My Claims", href: "/claims" },
          { label: "Upgrade Plan", href: "/promote-your-business" },
          { label: "Profile", href: "/settings?section=profile" },
        ]);
      } else {
        const [reviewsDataRaw, userClaims] = await Promise.all([
          safeGet("/api/reviews/mine"),
          safeGet("/api/listing-claims/mine"),
        ]);
        const reviewsData = reviewsDataRaw || { total: 0, items: [] };
        const claims: any[] = userClaims || [];

        setKpis([
          { label: "Reviews Written", value: reviewsData.total || 0, icon: MessageSquare, accent: "#0f766e", href: "/reviews", hint: "View reviews" },
          { label: "Claim Requests", value: claims.length, icon: FileText, accent: "#6366f1", href: "/claims", hint: "Track claims" },
          {
            label: "Approved",
            value: (reviewsData.items || []).filter((r: any) => r.status === "Approved").length,
            icon: CheckCircle,
            accent: "#10b981",
            href: "/reviews",
            hint: "Published",
          },
          {
            label: "In Review",
            value: (reviewsData.items || []).filter((r: any) => r.status === "Pending").length,
            icon: Clock,
            accent: "#f59e0b",
            href: "/reviews",
            hint: "Awaiting",
          },
        ]);

        setActivities(
          (reviewsData.items || []).slice(0, 5).map((r: any) => ({
            title: `Review for ${r.businessName || "Business"}`,
            meta: `Status: ${r.status || "Pending"} · ${r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ""}`,
            link: "/reviews",
            status: (r.status === "Approved" ? "approved" : r.status === "Pending" ? "pending" : "info") as any,
          })),
        );

        setQuickActions([
          { label: "Write a Review", href: "/reviews", primary: true },
          { label: "My Claims", href: "/claims" },
          { label: "My Profile", href: "/settings?section=profile" },
          { label: "Browse Listings", href: "/" },
        ]);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("We couldn't load your dashboard right now. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, isSuperAdmin, isOwner]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, load]);

  function handleRefresh() {
    setRefreshing(true);
    void load();
  }

  async function handleResendVerification() {
    setResendingVerification(true);
    setResendMessage(null);
    try {
      const token = getAuthToken();
      const email = session.email;
      if (!token || !email) return;
      const response = await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error(await response.text());
      setResendMessage("Verification email sent. Please check your inbox.");
    } catch (err) {
      setResendMessage(getApiErrorMessage(err, "Could not resend verification email."));
    } finally {
      setResendingVerification(false);
    }
  }

  function openKpi(href?: string) {
    if (href) router.push(href);
  }

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  const usagePercent =
    usage && usage.limit > 0
      ? Math.min(100, Math.round((usage.value / usage.limit) * 100))
      : 0;

  return (
    <AppShell
      title="Dashboard"
      subtitle={`${greeting()}, ${session.email ?? "welcome back"}. Here's your ${roleLabel} workspace.`}
    >
      <div className="dash-topbar">
        <span className={`role-badge role-${roleLabel.toLowerCase()}`}>
          {roleLabel}
        </span>
        <div className="dash-topbar-actions">
          <span className="dash-updated">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </span>
          <button
            className="btn btn-ghost dash-refresh"
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="dash-tabs">
        <button
          className={`dash-tab ${tab === "overview" ? "is-active" : ""}`}
          type="button"
          onClick={() => setTab("overview")}
        >
          <LayoutDashboard size={16} /> Overview
        </button>
        <button
          className={`dash-tab ${tab === "activity" ? "is-active" : ""}`}
          type="button"
          onClick={() => setTab("activity")}
        >
          <ActivityIcon size={16} /> Activity
          {activities.length > 0 && (
            <span className="dash-tab-count">{activities.length}</span>
          )}
        </button>
      </div>

      {error && (
        <div className="app-card dash-error">
          <p>{error}</p>
          <button className="btn btn-primary" type="button" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}

      {emailConfirmed === false && (
        <div className="app-card dash-verify-banner">
          <Mail size={20} />
          <div>
            <p className="dash-verify-title">Verify your email address</p>
            <p className="dash-verify-sub">
              Please confirm your email to unlock all features. Check your inbox for the verification link.
            </p>
            {resendMessage && (
              <p className={`app-note ${resendMessage.toLowerCase().includes("sent") ? "is-info" : "is-warn"}`}>
                {resendMessage}
              </p>
            )}
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleResendVerification}
            disabled={resendingVerification}
          >
            {resendingVerification ? "Sending..." : "Resend email"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="app-grid">
          {[0, 1, 2, 3].map((i) => (
            <div className="app-card kpi-card kpi-skeleton" key={i}>
              <div className="kpi-icon-wrap skeleton-box" />
              <div className="kpi-content">
                <div className="skeleton-line" style={{ width: "60%" }} />
                <div className="skeleton-line" style={{ width: "40%", height: 22 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {tab === "overview" && (
            <>
              <div className="app-grid">
                {kpis.map((item) => {
                  const Icon = item.icon;
                  const cardStyle = {
                    "--kpi-accent": item.accent,
                  } as React.CSSProperties;
                  const inner = (
                    <>
                      <div className="kpi-icon-wrap">
                        <Icon size={24} />
                      </div>
                      <div className="kpi-content">
                        <p className="kpi-label">{item.label}</p>
                        <p className="kpi-value">{item.value}</p>
                        {item.hint && <p className="kpi-hint">{item.hint}</p>}
                      </div>
                    </>
                  );
                  if (item.href) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="app-card kpi-card kpi-clickable"
                        style={cardStyle}
                        onClick={() => openKpi(item.href)}
                      >
                        {inner}
                      </button>
                    );
                  }
                  return (
                    <div
                      key={item.label}
                      className="app-card kpi-card"
                      style={cardStyle}
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>

              {usage && (
                <div className="app-card dash-usage">
                  <div className="dash-usage-head">
                    <span>
                      <strong>{usage.label}</strong>
                    </span>
                    <span className="dash-usage-num">
                      {usage.value}
                      {usage.limit > 0 ? ` / ${usage.limit}` : ""}
                    </span>
                  </div>
                  <div className="dash-usage-track">
                    <div
                      className="dash-usage-fill"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="app-card dash-quick">
                <h2 className="dash-section-title">Quick Actions</h2>
                <div className="dash-quick-grid">
                  {quickActions.map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className={`dash-quick-item ${a.primary ? "is-primary" : ""}`}
                    >
                      <Zap size={16} />
                      {a.label}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "activity" && (
            <div className="app-card">
              <h2 className="dash-section-title">Recent Activity</h2>
              {activities.length === 0 ? (
                <p className="app-subtitle">No recent updates to display.</p>
              ) : (
                <div className="activity-list">
                  {activities.map((activity, idx) => (
                    <div
                      key={idx}
                      className={`activity-row ${idx === activities.length - 1 ? "is-last" : ""}`}
                    >
                      <div className="activity-main">
                        <span
                          className={`activity-dot status-${activity.status || "info"}`}
                        />
                        <div>
                          <p className="activity-title">{activity.title}</p>
                          <p className="activity-meta">{activity.meta}</p>
                        </div>
                      </div>
                      {activity.link && (
                        <Link href={activity.link} className="btn btn-ghost activity-btn">
                          View
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
