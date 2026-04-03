import React, { useState, useEffect } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";

interface DashboardData {
  userId: string;
  memberCount: number;
  subscriptionStatus: string;
  planName: string;
  monthlyUsage: number;
  monthlyLimit: number;
  jobCount: number;
  completedJobCount: number;
  renewsAt: string;
}

export default function Dashboard() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchDashboard = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const token = getAuthToken();
        if (!token) throw new Error("Not authenticated.");
        const response = await fetch(`${apiBaseUrl}/api/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to load dashboard");
        const json = await response.json();
        setData(json);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load dashboard."));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [isAuthenticated]);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }
  if (loading) return <div className="app-loading">Loading dashboard...</div>;
  if (error) return <AppShell requiredRole="Admin" title="Admin Dashboard"><div className="msg msg-error">{error}</div></AppShell>;

  const usagePercent = data
    ? data.monthlyLimit > 0
      ? Math.round((data.monthlyUsage / data.monthlyLimit) * 100)
      : 0
    : 0;

  return (
    <AppShell requiredRole="Admin" title="Admin Dashboard" subtitle="Overview of usage, subscriptions, and operational health.">
      <div className="app-grid">
        <div className="app-card">
          <h3>Members</h3>
          <p><strong>{data?.memberCount}</strong></p>
        </div>

        <div className="app-card">
          <h3>Plan</h3>
          <p><strong>{data?.planName}</strong></p>
          <p>{data?.subscriptionStatus}</p>
        </div>

        <div className="app-card">
          <h3>Usage</h3>
          <p><strong>{usagePercent}%</strong></p>
          <div style={{ width: "100%", background: "#e8eef2", borderRadius: 999, height: 10 }}>
            <div
              style={{ width: `${Math.min(usagePercent, 100)}%`, background: "#0f766e", height: 10, borderRadius: 999 }}
            />
          </div>
          <p>{data?.monthlyUsage} / {data?.monthlyLimit} rows</p>
        </div>

        <div className="app-card">
          <h3>Completed Jobs</h3>
          <p><strong>{data?.completedJobCount} / {data?.jobCount}</strong></p>
        </div>
      </div>

      <div className="app-card">
        <h2>Subscription Info</h2>
        <p><strong>Renews:</strong> {data?.renewsAt ? new Date(data.renewsAt).toLocaleDateString() : "N/A"}</p>
      </div>
    </AppShell>
  );
}
