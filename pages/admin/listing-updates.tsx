import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiFetch } from "../../lib/apiClient";
import FormMessage from "../../components/shared/FormMessage";

type ListingUpdate = {
  Id: string;
  BusinessId: number;
  Cid: string;
  RequestedByUserId: string;
  Status: string;
  RejectionReason?: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  ModeratedAt?: string | null;
  ModeratedByUserId?: string | null;
};

type ListingUpdateLog = {
  Id: string;
  RequestId: string;
  Action: string;
  Note?: string | null;
  PayloadJson?: string | null;
  CreatedAt: string;
  CreatedByUserId?: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
};

const statusOptions = ["Pending", "Approved", "Rejected", "All"];

export default function ListingUpdatesPage() {
  const [items, setItems] = useState<ListingUpdate[]>([]);
  const [logs, setLogs] = useState<ListingUpdateLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
  });
  const [status, setStatus] = useState("Pending");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("desc");
  const [logRequestId, setLogRequestId] = useState("");
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
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pagination.pageSize));
      if (status && status !== "All") params.set("status", status);
      if (query.trim()) params.set("q", query.trim());
      params.set("order", order);
      const res = await apiFetch(`/api/admin/listing-updates?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load listing updates.");
      const data = await res.json();
      setItems(data.items ?? []);
      setPagination(data.pagination ?? { page: 1, pageSize: 20, totalCount: 0 });
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to load listing updates."));
    }
    setLoading(false);
  }

  async function loadLogs(requestId?: string) {
    setMessage("");
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (requestId) params.set("requestId", requestId);
      const res = await apiFetch(`/api/admin/listing-updates/logs?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load logs.");
      const data = await res.json();
      setLogs(data ?? []);
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to load logs."));
    }
  }

  async function approveRequest(id: string) {
    setMessage("");
    try {
      const token = getAuthToken();
      const res = await apiFetch(`/api/admin/listing-updates/${id}/approve`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to approve update.");
      await loadRequests(pagination.page);
      await loadLogs(id);
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to approve update."));
    }
  }

  async function rejectRequest(id: string) {
    const reason = prompt("Enter rejection reason (optional):") || "";
    setMessage("");
    try {
      const token = getAuthToken();
      const res = await apiFetch(`/api/admin/listing-updates/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to reject update.");
      await loadRequests(pagination.page);
      await loadLogs(id);
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to reject update."));
    }
  }

  useEffect(() => {
    void loadRequests(1);
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell title="Listing Update Requests" subtitle="Approve or reject owner-submitted edits." requiredRole="Admin">
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
            <input className="form-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="CID or Business ID" />
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
        {message ? <FormMessage message={message} tone="error" /> : null}
      </div>

      <div className="app-card">
        <div className="pub-table-wrap">
          <table className="pub-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Created</th>
                <th>Moderation</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5}>No update requests found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.Id}>
                    <td>
                      <strong>Business ID:</strong> {item.BusinessId}
                      <div className="pub-muted">CID: {item.Cid}</div>
                    </td>
                    <td>
                      <strong>{item.Status}</strong>
                      {item.RejectionReason ? (
                        <div className="pub-muted">Reason: {item.RejectionReason}</div>
                      ) : null}
                    </td>
                    <td>{item.RequestedByUserId}</td>
                    <td>{new Date(item.CreatedAt).toLocaleString()}</td>
                    <td>
                      {item.Status === "Pending" ? (
                        <div className="app-actions">
                          <button className="btn btn-primary" type="button" onClick={() => approveRequest(item.Id)}>
                            Approve
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => rejectRequest(item.Id)}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="pub-muted">No actions</span>
                      )}
                      <div>
                        <button className="btn btn-ghost" type="button" onClick={() => loadLogs(item.Id)}>
                          View logs
                        </button>
                      </div>
                    </td>
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

      <div className="app-card">
        <h2>Update Logs</h2>
        <div className="app-actions">
          <input
            className="form-input"
            style={{ maxWidth: 320 }}
            placeholder="Filter by request ID"
            value={logRequestId}
            onChange={(e) => setLogRequestId(e.target.value)}
          />
          <button className="btn btn-ghost" type="button" onClick={() => loadLogs(logRequestId.trim())}>
            Load logs
          </button>
        </div>
        <div className="pub-table-wrap" style={{ marginTop: 12 }}>
          <table className="pub-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Action</th>
                <th>Note</th>
                <th>By</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5}>No logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.Id}>
                    <td>{log.RequestId}</td>
                    <td>{log.Action}</td>
                    <td>{log.Note ?? "-"}</td>
                    <td>{log.CreatedByUserId ?? "-"}</td>
                    <td>{new Date(log.CreatedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
