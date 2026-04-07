import AppShell from "../components/app/AppShell";

const kpis = [
  { label: "Total Listings", value: "1,284" },
  { label: "Active Claims", value: "86" },
  { label: "Reviews This Month", value: "412" },
  { label: "Avg. Rating", value: "4.6" },
];

const activities = [
  { title: "New claim submitted", meta: "Claim #1042 - 8 minutes ago" },
  { title: "Subscription upgraded", meta: "Team Plan - 2 hours ago" },
  { title: "Listing edit approved", meta: "Listing #889 - Today" },
  { title: "Event published", meta: "Community Events - Yesterday" },
];

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="A single view of every stat, metric, and workflow across your account."
    >
      <div className="app-grid">
        {kpis.map((item) => (
          <div className="app-card" key={item.label}>
            <h3 style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
              {item.label}
            </h3>
            <p style={{ margin: "8px 0 0", fontSize: "1.6rem", fontWeight: 800 }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="app-grid" style={{ marginTop: "16px" }}>
        <section className="app-card">
          <h2 style={{ marginTop: 0 }}>Analytics Snapshot</h2>
          <p className="app-subtitle">
            Streaming KPIs, conversion trends, and growth signals will render here once the
            analytics API is connected.
          </p>
          <div
            style={{
              marginTop: "14px",
              height: "220px",
              borderRadius: "12px",
              border: "1px dashed #cbd5f5",
              background: "#eef2ff",
              display: "grid",
              placeItems: "center",
              color: "#4338ca",
              fontWeight: 600,
            }}
          >
            Analytics chart placeholder
          </div>
        </section>

        <section className="app-card">
          <h2 style={{ marginTop: 0 }}>Recent Activity</h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {activities.map((activity) => (
              <div key={activity.title} className="app-card" style={{ padding: "10px" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{activity.title}</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  {activity.meta}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="app-card" style={{ marginTop: "16px" }}>
        <h2 style={{ marginTop: 0 }}>Operational Health</h2>
        <div className="app-grid">
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Response Time</p>
            <p style={{ margin: 0, color: "#64748b" }}>Average 180ms over the last 24 hours.</p>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Queue Backlog</p>
            <p style={{ margin: 0, color: "#64748b" }}>12 items pending moderation.</p>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Member Growth</p>
            <p style={{ margin: 0, color: "#64748b" }}>+6.3% MoM active customers.</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
