import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AppShell from "../components/app/AppShell";
import { useRequireAuth, getAuthToken } from "../lib/auth";
import { getUserSessionFromToken, hasRole } from "../lib/session";
import { apiUrl } from "../lib/apiClient";
import {
  Users,
  Building2,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  MessageSquare,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";

// Types for dynamic data
type ActivityItem = {
  title: string;
  meta: string;
  link?: string;
};

export default function DashboardPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const session = useMemo(() => getUserSessionFromToken(getAuthToken()), []);

  const isAdmin = hasRole(session, "Admin");
  const isSuperAdmin = hasRole(session, "SuperAdmin");
  const isOwner = session.roles.includes("Owner");

  const isStrictUser =
    session.roles.includes("User") && !isAdmin && !isSuperAdmin && !isOwner;

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [kpis, setKpis] = useState<
    Array<{ label: string; value: string | number; icon: any; color: string }>
  >([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadDashboardData() {
      setLoading(true);
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      try {
        if (isAdmin || isSuperAdmin) {
          // Admin & SuperAdmin view
          const [dbRes, pendingClaimsRes, pendingReviewsRes, pendingCommRes] =
            await Promise.all([
              axios.get(apiUrl("/api/admin/dashboard"), { headers }),
              axios.get(apiUrl("/api/listing-claims/pending"), { headers }),
              axios.get(apiUrl("/api/reviews/pending"), { headers }),
              axios.get(apiUrl("/api/community/pending"), { headers }),
            ]);

          const data = dbRes.data;
          setKpis([
            {
              label: "Total Members",
              value: data.memberCount,
              icon: Users,
              color: "#4338ca",
            },
            {
              label: "Pending Claims",
              value: pendingClaimsRes.data.length,
              icon: AlertCircle,
              color: "#f59e0b",
            },
            {
              label: "Pending Reviews",
              value: pendingReviewsRes.data.length,
              icon: MessageSquare,
              color: "#10b981",
            },
            {
              label: "Pending Community",
              value:
                pendingCommRes.data.events.length +
                pendingCommRes.data.societies.length,
              icon: LayoutGrid,
              color: "#8b5cf6",
            },
            {
              label: "Monthly Usage",
              value: `${data.monthlyUsage} / ${data.monthlyLimit}`,
              icon: TrendingUp,
              color: "#3b82f6",
            },
          ]);

          setActivities([
            ...pendingClaimsRes.data.slice(0, 3).map((c: any) => ({
              title: `Claim Request: ${c.businessName}`,
              meta: `By ${c.contactEmail} - ${new Date(c.createdAt).toLocaleDateString()}`,
              link: "/admin/listing-claims",
            })),
            ...pendingReviewsRes.data.slice(0, 3).map((r: any) => ({
              title: `New Review for ${r.businessName}`,
              meta: `${r.rating} stars - ${new Date(r.createdAt).toLocaleDateString()}`,
              link: "/admin/reviews",
            })),
            ...pendingCommRes.data.events.slice(0, 2).map((e: any) => ({
              title: `New Event: ${e.Title}`,
              meta: `${e.CitySlug} - ${new Date(e.CreatedAt).toLocaleDateString()}`,
              link: "/admin/community/events",
            })),
          ]);
        } else if (isOwner) {
          // Owner view
          const [listingsRes, claimsRes] = await Promise.all([
            axios.get(apiUrl("/api/owner-listings/mine"), { headers }),
            axios.get(apiUrl("/api/listing-claims/mine"), { headers }),
          ]);

          setKpis([
            {
              label: "My Listings",
              value: listingsRes.data.length,
              icon: Building2,
              color: "#0f766e",
            },
            {
              label: "My Claims",
              value: claimsRes.data.length,
              icon: FileText,
              color: "#6366f1",
            },
            {
              label: "Reviews Received",
              value: listingsRes.data.reduce(
                (acc: number, b: any) => acc + (b.totalReviews || 0),
                0,
              ),
              icon: Star,
              color: "#f59e0b",
            },
            {
              label: "Active Plan",
              value: listingsRes.data[0]?.planName || "Free",
              icon: CheckCircle,
              color: "#10b981",
            },
          ]);

          setActivities(
            claimsRes.data.slice(0, 5).map((c: any) => ({
              title: `Claim: ${c.businessName || "Business"}`,
              meta: `Current Status: ${c.status}`,
              link: "/claims",
            })),
          );
        } else {
          // Regular User view
          const [reviewsRes, claimsRes] = await Promise.all([
            axios.get(apiUrl("/api/reviews/mine"), { headers }),
            axios.get(apiUrl("/api/listing-claims/mine"), { headers }),
          ]);

          setKpis([
            {
              label: "Reviews Written",
              value: reviewsRes.data.total,
              icon: MessageSquare,
              color: "#0f766e",
            },
            {
              label: "Claim Requests",
              value: claimsRes.data.length,
              icon: FileText,
              color: "#6366f1",
            },
            {
              label: "Approved Reviews",
              value: reviewsRes.data.items.filter(
                (r: any) => r.status === "Approved",
              ).length,
              icon: CheckCircle,
              color: "#10b981",
            },
            {
              label: "In Review",
              value: reviewsRes.data.items.filter(
                (r: any) => r.status === "Pending",
              ).length,
              icon: Clock,
              color: "#f59e0b",
            },
          ]);

          setActivities(
            reviewsRes.data.items.slice(0, 5).map((r: any) => ({
              title: `Review for ${r.businessName}`,
              meta: `Status: ${r.status} - ${new Date(r.updatedAt).toLocaleDateString()}`,
              link: "/reviews",
            })),
          );
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [isAuthenticated, isAdmin, isSuperAdmin, isOwner]);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Welcome back, ${session.email}. Manage your activity and listings.`}
    >
      {loading ? (
        <div
          className="app-card"
          style={{ textAlign: "center", padding: "40px" }}
        >
          <p className="app-muted">Loading your personalized dashboard...</p>
        </div>
      ) : (
        <>
          <div className="app-grid">
            {kpis.map((item) => (
              <div
                className="app-card"
                key={item.label}
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    background: `${item.color}15`,
                    color: item.color,
                    padding: "12px",
                    borderRadius: "12px",
                  }}
                >
                  <item.icon size={24} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.label}
                  </h3>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "1.4rem",
                      fontWeight: 800,
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="app-grid" style={{ marginTop: "16px" }}>
            <section className="app-card">
              <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
                Recent Activity
              </h2>
              <div style={{ display: "grid", gap: "10px" }}>
                {activities.length === 0 ? (
                  <p className="app-subtitle">No recent updates to display.</p>
                ) : (
                  activities.map((activity, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        borderBottom:
                          idx === activities.length - 1
                            ? "none"
                            : "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 700 }}>
                          {activity.title}
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "0.85rem",
                            color: "#64748b",
                          }}
                        >
                          {activity.meta}
                        </p>
                      </div>
                      {activity.link && (
                        <Link
                          href={activity.link}
                          className="btn btn-ghost"
                          style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="app-card">
              <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Quick Access</h2>
              <div
                className="app-actions"
                style={{ flexDirection: "column", alignItems: "stretch" }}
              >
                {isAdmin && (
                  <Link
                    href="/admin/listing-updates"
                    className="btn btn-primary"
                  >
                    Moderate Listing Updates
                  </Link>
                )}
                {isOwner && (
                  <Link href="/owner/listing" className="btn btn-primary">
                    Edit My Business
                  </Link>
                )}
                <Link href="/profile" className="btn btn-ghost">
                  My Profile
                </Link>
                <Link href="/reviews" className="btn btn-ghost">
                  Manage Reviews
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
