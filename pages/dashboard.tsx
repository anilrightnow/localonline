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
          // Removed inline style and added class for styling
          className="dashboard-loader app-card"
        >
          <p className="app-muted">Loading your personalized dashboard...</p>
        </div>
      ) : (
        <>
          <div className="app-grid">
            {kpis.map((item) => (
              <div className="app-card kpi-card" key={item.label}>
                <div className="kpi-icon-wrap">
                  <item.icon size={24} />
                </div>
                <div className="kpi-content">
                  <h3 className="kpi-label">{item.label}</h3>
                  <p className="kpi-value">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="app-grid dashboard-secondary-grid">
            <section
              // Removed inline style and added class for styling
              className="app-card recent-activity-card"
            >
              <h2 className="card-title activity-card-title">
                Recent Activity
              </h2>
              <div
                // Removed inline style and added class for styling
                className="activity-list"
              >
                {activities.length === 0 ? (
                  <p className="app-subtitle">No recent updates to display.</p>
                ) : (
                  activities.map((activity, idx) => (
                    <div
                      key={idx}
                      className={`activity-row ${idx === activities.length - 1 ? "is-last" : ""}`}
                    >
                      <div>
                        <p
                          // Removed inline style and added class for styling
                          className="activity-title"
                        >
                          {activity.title}
                        </p>
                        <p
                          // Removed inline style and added class for styling
                          className="activity-meta"
                        >
                          {activity.meta}
                        </p>
                      </div>
                      {activity.link && (
                        <Link
                          href={activity.link}
                          className="btn btn-ghost activity-btn"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section
              // Removed inline style and added class for styling
              className="app-card quick-access-card"
            >
              <h2 className="card-title quick-access-title">Quick Access</h2>
              <div
                // Removed inline style and added class for styling
                className="quick-access-list"
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

      <style jsx>{`
        .dashboard-loader {
          text-align: center;
          padding: 40px;
        }
        .kpi-card {
          --kpi-color: #000; /* Fallback, actual color set by JS */
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .app-card {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .kpi-icon-wrap {
          background: color-mix(in srgb, var(--kpi-color) 15%, transparent);
          color: var(--kpi-color);
          padding: 12px;
          border-radius: 12px;
          display: flex;
        }
        .kpi-content {
          flex: 1;
        }
        .kpi-label {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
          text-transform: uppercase;
        }
        .kpi-value {
          margin: 4px 0 0;
          font-size: 1.4rem;
          font-weight: 800;
        }
        .dashboard-secondary-grid {
          margin-top: 16px;
        }
        .recent-activity-card {
          /* Specific styles for recent activity card if needed */
        }
        .quick-access-card {
          /* Specific styles for quick access card if needed */
        }
        .card-title {
          margin-top: 0;
          font-size: 1.1rem;
        }
        .activity-list {
          display: grid;
          gap: 10px;
        }
        .activity-row {
          padding: 12px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .activity-row.is-last {
          border-bottom: none;
        }
        .activity-title {
          margin: 0;
          font-weight: 700;
        }
        .activity-meta {
          margin: 4px 0 0;
          font-size: 0.85rem;
          color: #64748b;
        }
        .activity-btn {
          padding: 4px 8px;
          font-size: 0.8rem;
        }
        .quick-access-list {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
        }
      `}</style>
    </AppShell>
  );
}
