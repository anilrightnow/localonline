import React, { useEffect, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";

type OverviewResponse = {
  from: string;
  to: string;
  totals: {
    analyticsEvents: number;
    listingClaims: number;
    reviewsSubmitted: number;
  };
  byType: Array<{ eventType: string; total: number }>;
  topPages: Array<{ path: string; total: number }>;
  topBusinesses: Array<{ cid: string; businessToken: string; name: string; total: number }>;
};

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview(targetDays: number) {
    setLoading(true);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBaseUrl}/api/analytics/admin/overview?days=${targetDays}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(await response.text());
      const json = (await response.json()) as OverviewResponse;
      setData(json);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load analytics."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview(days);
  }, [days]);

  if (loading) return <div className="app-loading">Loading analytics...</div>;

  return (
    <AppShell requiredRole="Admin" title="Usage Analytics" subtitle="Cross-user claims, reviews, and event signals.">
      {error ? <div className="msg msg-error">{error}</div> : null}
      <div className="app-actions">
        <select className="form-select" style={{ maxWidth: 180 }} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>
      {data ? (
        <>
          <div className="app-grid">
            <div className="app-card">
              <h3>Analytics Events</h3>
              <p><strong>{data.totals.analyticsEvents}</strong></p>
            </div>
            <div className="app-card">
              <h3>Listing Claims</h3>
              <p><strong>{data.totals.listingClaims}</strong></p>
            </div>
            <div className="app-card">
              <h3>Reviews Submitted</h3>
              <p><strong>{data.totals.reviewsSubmitted}</strong></p>
            </div>
          </div>
          <div className="app-card">
            <h3>Events by Type</h3>
            {data.byType.length === 0 ? <p>No analytics events found.</p> : null}
            <ul>
              {data.byType.map((item) => (
                <li key={item.eventType}>{item.eventType}: {item.total}</li>
              ))}
            </ul>
          </div>
          <div className="app-card">
            <h3>Top Pages</h3>
            {data.topPages.length === 0 ? <p>No page views yet.</p> : null}
            <ul>
              {data.topPages.map((item) => (
                <li key={item.path}>{item.path}: {item.total}</li>
              ))}
            </ul>
          </div>
          <div className="app-card">
            <h3>Top Businesses</h3>
            {data.topBusinesses.length === 0 ? <p>No business views yet.</p> : null}
            <ul>
              {data.topBusinesses.map((item) => (
                <li key={item.cid}>{item.name}: {item.total}</li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
