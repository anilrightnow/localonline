import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getApiErrorMessage } from "../../lib/apiError";

type AdRequest = {
  Id: string;
  BusinessName: string;
  ContactName: string;
  Email: string;
  Phone: string;
  City: string;
  Area: string;
  Budget: string;
  Message: string;
  Status: string;
  CreatedAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
};

const statusOptions = ["All", "New", "Contacted", "Closed"];

export default function AdRequestsPage() {
  const [items, setItems] = useState<AdRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
  });
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize)),
    [pagination],
  );

  async function loadRequests(page = 1) {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pagination.pageSize));
      if (status && status !== "All") params.set("status", status);
      if (query.trim()) params.set("q", query.trim());
      if (city.trim()) params.set("city", city.trim());
      if (area.trim()) params.set("area", area.trim());
      params.set("sort", sort);
      params.set("order", order);
      const res = await fetch(`/api/admin/ad-requests?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load ad requests.");
      const data = await res.json();
      setItems(data.items ?? []);
      setPagination(data.pagination ?? { page: 1, pageSize: 20, totalCount: 0 });
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to load ad requests."));
    }
    setLoading(false);
  }

  async function updateStatus(id: string, nextStatus: string) {
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/ad-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      await loadRequests(pagination.page);
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to update status."));
    }
  }

  useEffect(() => {
    void loadRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell title="Ad Requests" subtitle="Review and manage advertising inquiries." requiredRole="Admin">
      <div className="app-card">
        <div className="app-grid">
          <div className="form-row">
            <label>Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Search</label>
            <input className="form-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Business, contact, email, phone" />
          </div>
          <div className="form-row">
            <label>City</label>
            <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Area</label>
            <input className="form-input" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Sort</label>
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="createdAt">Created date</option>
              <option value="status">Status</option>
              <option value="budget">Budget</option>
              <option value="city">City</option>
            </select>
          </div>
          <div className="form-row">
            <label>Order</label>
            <select className="form-select" value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>
        <div className="app-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" type="button" onClick={() => loadRequests(1)} disabled={loading}>
            {loading ? "Loading..." : "Apply filters"}
          </button>
        </div>
        {message ? <div className="msg msg-error" style={{ marginTop: 10 }}>{message}</div> : null}
      </div>

      <div className="app-card">
        <div className="pub-table-wrap">
          <table className="pub-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6}>No ad requests found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.Id}>
                    <td>
                      <strong>{item.BusinessName}</strong>
                      <div className="pub-muted">{item.Message}</div>
                    </td>
                    <td>
                      {item.ContactName}
                      <div className="pub-muted">{item.Email}</div>
                      <div className="pub-muted">{item.Phone}</div>
                    </td>
                    <td>
                      {item.Area}, {item.City}
                    </td>
                    <td>{item.Budget}</td>
                    <td>
                      <select
                        className="form-select"
                        value={item.Status}
                        onChange={(e) => updateStatus(item.Id, e.target.value)}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td>{new Date(item.CreatedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="app-actions" style={{ marginTop: 12 }}>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => loadRequests(Math.max(1, pagination.page - 1))}
            disabled={pagination.page <= 1 || loading}
          >
            Previous
          </button>
          <span className="pub-muted">
            Page {pagination.page} of {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => loadRequests(Math.min(totalPages, pagination.page + 1))}
            disabled={pagination.page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>
    </AppShell>
  );
}
