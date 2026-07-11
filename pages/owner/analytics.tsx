import React, { useCallback } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getApiErrorMessageFromResponse } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import { getUserSessionFromToken, hasRole } from "../../lib/session";
import AnalyticsDashboard, {
  type OverviewResponse,
} from "../../components/app/AnalyticsDashboard";

export default function OwnerAnalyticsPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const session = getUserSessionFromToken(getAuthToken());
  const isAdmin = hasRole(session, "Admin");
  const isOwner = session.roles.includes("Owner");

  const loadOverview = useCallback(
    async (range: string): Promise<OverviewResponse> => {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await fetch(
        `${apiUrl("/api/analytics/owner/overview")}?range=${encodeURIComponent(range)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(await getApiErrorMessageFromResponse(response, "Failed to load analytics."));
      }
      return (await response.json()) as OverviewResponse;
    },
    [],
  );

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  if (!isAdmin && !isOwner) {
    return (
      <AppShell title="Analytics" subtitle="Track performance of your businesses">
        <section className="app-card">
          <h2>Owner access required</h2>
          <p className="app-muted">
            Claim and get approval for a business to view its analytics.
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Business Analytics"
      subtitle="Performance of your claimed businesses across the platform."
    >
      <AnalyticsDashboard
        loadOverview={loadOverview}
        showTopBusinesses
        showEventsByType={false}
        emptyMessage="No analytics yet. Once visitors view your business profiles and pages, the metrics will appear here."
      />
    </AppShell>
  );
}
