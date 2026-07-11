import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Eye,
  Building2,
  CreditCard,
  Users,
  Star,
  ClipboardCheck,
  UserPlus,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title,
);

export type OverviewTotals = {
  events: number;
  pageViews: number;
  businessViews: number;
  payments: number;
  activeUsers: number;
  listingClaims: number;
  reviewsSubmitted: number;
  reviewsApproved: number;
  reviewsPending: number;
  newUsers: number;
};

export type OverviewResponse = {
  allTime?: boolean;
  from?: string | null;
  to?: string;
  businessCount?: number;
  totals: OverviewTotals;
  byType: Array<{ eventType: string; total: number }>;
  topPages: Array<{ page: string; total: number }>;
  topBusinesses: Array<{ businessId: string | null; name: string; total: number }>;
  reviews: Array<{ status: number; total: number }>;
  daily: Array<{
    date: string;
    events: number;
    pageViews: number;
    businessViews: number;
  }>;
};

export type AnalyticsDashboardProps = {
  loadOverview: (range: string) => Promise<OverviewResponse>;
  rangeOptions?: Array<{ value: string; label: string }>;
  showTopBusinesses?: boolean;
  showEventsByType?: boolean;
  emptyMessage?: string;
};

const DEFAULT_RANGES = [
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "3 Months" },
  { value: "180d", label: "6 Months" },
  { value: "all", label: "All Time" },
];

const CHART_COLORS = [
  "#0d9488",
  "#ffb800",
  "#6366f1",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
];

const REVIEW_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
  3: "Flagged",
};

const baseGrid = {
  grid: { color: "rgba(148,163,184,0.18)" },
  ticks: { color: "#64748b", font: { size: 11 } },
};

const baseLegend = {
  labels: { color: "#64748b", boxWidth: 12, font: { size: 12 } },
};

function formatDateTick(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="analytics-stat" style={{ borderTopColor: accent }}>
      <div className="analytics-stat-icon" style={{ backgroundColor: `${accent}1a`, color: accent }}>
        <Icon size={20} />
      </div>
      <div className="analytics-stat-body">
        <span className="analytics-stat-value">{value.toLocaleString("en-IN")}</span>
        <span className="analytics-stat-label">{label}</span>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  height = 280,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <section className="analytics-card">
      <header className="analytics-card-head">
        <h3>{title}</h3>
        {subtitle ? <span>{subtitle}</span> : null}
      </header>
      <div style={{ position: "relative", height }}>
        {children}
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="analytics-empty">{message}</div>;
}

type RankedItem = { label: string; value: number };

function RankedList({
  items,
  accent,
  empty,
}: {
  items: RankedItem[];
  accent: string;
  empty: string;
}) {
  if (items.length === 0) return <EmptyState message={empty} />;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ol className="analytics-ranklist">
      {items.map((it, idx) => (
        <li key={`${it.label}-${idx}`} className="analytics-rankrow">
          <span className="analytics-rank">{idx + 1}</span>
          <div className="analytics-rankbody">
            <div className="analytics-ranktop">
              <span className="analytics-ranklabel" title={it.label}>
                {it.label}
              </span>
              <span className="analytics-rankval">
                {it.value.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="analytics-rankbar">
              <span
                style={{
                  width: `${Math.max((it.value / max) * 100, 4)}%`,
                  backgroundColor: accent,
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function AnalyticsDashboard({
  loadOverview,
  rangeOptions = DEFAULT_RANGES,
  showTopBusinesses = true,
  showEventsByType = true,
  emptyMessage = "No analytics data found for this period.",
}: AnalyticsDashboardProps) {
  const [range, setRange] = useState(rangeOptions[2]?.value ?? "30d");
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loadOverview(range)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) {
          setError(err?.message || "Failed to load analytics.");
          setData(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, loadOverview]);

  const t = data?.totals;

  const trendData = useMemo(() => {
    const daily = data?.daily ?? [];
    return {
      labels: daily.map((d) => formatDateTick(d.date)),
      datasets: [
        {
          label: "Events",
          data: daily.map((d) => d.events),
          borderColor: "#0d9488",
          backgroundColor: "rgba(13,148,136,0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          borderWidth: 2,
        },
        {
          label: "Page Views",
          data: daily.map((d) => d.pageViews),
          borderColor: "#ffb800",
          backgroundColor: "rgba(255,184,0,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          borderWidth: 2,
        },
        {
          label: "Business Views",
          data: daily.map((d) => d.businessViews),
          borderColor: "#6366f1",
          backgroundColor: "rgba(99,102,241,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  const byTypeData = useMemo(() => {
    const items = data?.byType ?? [];
    return {
      labels: items.map((i) => i.eventType),
      datasets: [
        {
          data: items.map((i) => i.total),
          backgroundColor: items.map((_, idx) => CHART_COLORS[idx % CHART_COLORS.length]),
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const reviewsData = useMemo(() => {
    const items = data?.reviews ?? [];
    const labels = items.map((i) => REVIEW_STATUS_LABELS[i.status] ?? `Status ${i.status}`);
    const colors = items.map((i) =>
      i.status === 1 ? "#10b981" : i.status === 2 ? "#ef4444" : i.status === 3 ? "#f59e0b" : "#94a3b8",
    );
    return {
      labels,
      datasets: [
        {
          data: items.map((i) => i.total),
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const topPagesData = useMemo(() => {
    const items = [...(data?.topPages ?? [])].sort((a, b) => b.total - a.total).slice(0, 10);
    return {
      labels: items.map((i) => i.page),
      datasets: [
        {
          label: "Views",
          data: items.map((i) => i.total),
          backgroundColor: "#0d9488",
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  const topBusinessesData = useMemo(() => {
    const items = [...(data?.topBusinesses ?? [])].sort((a, b) => b.total - a.total).slice(0, 10);
    return {
      labels: items.map((i) => i.name || i.businessId || "Unknown"),
      datasets: [
        {
          label: "Views",
          data: items.map((i) => i.total),
          backgroundColor: "#6366f1",
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  const hasContent = data && (t?.events || 0) > 0;

  return (
    <div className="analytics-wrap">
      <div className="analytics-toolbar">
        <div className="analytics-ranges" role="tablist" aria-label="Time range">
          {rangeOptions.map((r) => (
            <button
              key={r.value}
              type="button"
              className={`analytics-range ${range === r.value ? "is-active" : ""}`}
              onClick={() => setRange(r.value)}
              disabled={loading}
            >
              {r.label}
            </button>
          ))}
        </div>
        {data?.businessCount != null && (
          <span className="analytics-badge">
            <Building2 size={14} /> {data.businessCount} business{data.businessCount === 1 ? "" : "es"}
          </span>
        )}
      </div>

      {error ? <div className="analytics-error">{error}</div> : null}

      {loading ? (
        <div className="analytics-loading">Loading analytics…</div>
      ) : !hasContent ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <>
          <div className="analytics-stats">
            <StatCard icon={Activity} label="Total Events" value={t?.events ?? 0} accent="#0d9488" />
            <StatCard icon={Eye} label="Page Views" value={t?.pageViews ?? 0} accent="#ffb800" />
            <StatCard icon={Building2} label="Business Views" value={t?.businessViews ?? 0} accent="#6366f1" />
            <StatCard icon={CreditCard} label="Payments" value={t?.payments ?? 0} accent="#10b981" />
            <StatCard icon={Users} label="Active Users" value={t?.activeUsers ?? 0} accent="#3b82f6" />
            <StatCard icon={ClipboardCheck} label="Listing Claims" value={t?.listingClaims ?? 0} accent="#f59e0b" />
            <StatCard icon={Star} label="Reviews" value={t?.reviewsSubmitted ?? 0} accent="#ec4899" />
            <StatCard icon={UserPlus} label="New Users" value={t?.newUsers ?? 0} accent="#8b5cf6" />
          </div>

          <ChartCard
            title="Activity Over Time"
            subtitle="Daily events, page views & business views"
            height={320}
          >
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: { legend: baseLegend, tooltip: { enabled: true } },
                scales: { x: baseGrid, y: { ...baseGrid, beginAtZero: true } },
              }}
            />
          </ChartCard>

          <div className="analytics-grid-2">
            {showEventsByType ? (
              <ChartCard title="Events by Type" subtitle="Distribution across the site">
                {byTypeData.labels.length ? (
                  <Doughnut
                    data={byTypeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "62%",
                      plugins: { legend: { ...baseLegend, position: "right" } },
                    }}
                  />
                ) : (
                  <EmptyState message="No events recorded." />
                )}
              </ChartCard>
            ) : null}

            <ChartCard title="Reviews by Status" subtitle="Moderation overview">
              {reviewsData.labels.length ? (
                <Doughnut
                  data={reviewsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "62%",
                    plugins: { legend: { ...baseLegend, position: "right" } },
                  }}
                />
              ) : (
                <EmptyState message="No reviews recorded." />
              )}
            </ChartCard>
          </div>

          <div className="analytics-grid-2">
            <section className="analytics-card">
              <header className="analytics-card-head">
                <h3>Top Pages</h3>
                <span>Most viewed pages</span>
              </header>
              <div style={{ position: "relative", height: 240 }}>
                {topPagesData.labels.length ? (
                  <Bar
                    data={topPagesData}
                    options={{
                      indexAxis: "y",
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { x: { ...baseGrid, beginAtZero: true }, y: baseGrid },
                    }}
                  />
                ) : (
                  <EmptyState message="No page views yet." />
                )}
              </div>
              <RankedList
                items={(data?.topPages ?? [])
                  .slice()
                  .sort((a, b) => b.total - a.total)
                  .map((i) => ({ label: i.page, value: i.total }))}
                accent="#0d9488"
                empty="No page views yet."
              />
            </section>

            {showTopBusinesses ? (
              <section className="analytics-card">
                <header className="analytics-card-head">
                  <h3>Top Businesses</h3>
                  <span>Most viewed businesses</span>
                </header>
                <div style={{ position: "relative", height: 240 }}>
                  {topBusinessesData.labels.length ? (
                    <Bar
                      data={topBusinessesData}
                      options={{
                        indexAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: { ...baseGrid, beginAtZero: true }, y: baseGrid },
                      }}
                    />
                  ) : (
                    <EmptyState message="No business views yet." />
                  )}
                </div>
                <RankedList
                  items={(data?.topBusinesses ?? [])
                    .slice()
                    .sort((a, b) => b.total - a.total)
                    .map((i) => ({ label: i.name || i.businessId || "Unknown", value: i.total }))}
                  accent="#6366f1"
                  empty="No business views yet."
                />
              </section>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
