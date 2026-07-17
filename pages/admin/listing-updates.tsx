import { useEffect, useMemo, useState, Fragment } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiFetch } from "../../lib/apiClient";
import FormMessage from "../../components/shared/FormMessage";
import StructuredDataView from "../../components/shared/StructuredDataView";
import { normalize, EditorMode } from "../../components/shared/structuredDataModel";

type ListingUpdate = {
  Id: string;
  BusinessId: number;
  Cid: string;
  BusinessName?: string | null;
  RequestedByUserId: string;
  Status: string;
  RejectionReason?: string | null;
  PayloadJson?: string | null;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function parsePayload(payloadJson?: string | null) {
    if (!payloadJson) return null;
    try {
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  }

  function getMediaItems(payload: any): Array<{ PublicId?: string; LargeUrl?: string; ThumbUrl?: string }> {
    const media = payload?.mediaJson;
    if (Array.isArray(media)) return media;
    return [];
  }

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

  async function approveRequest(id: string, comment: string) {
    setMessage("");
    try {
      const token = getAuthToken();
      const res = await apiFetch(`/api/admin/listing-updates/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) throw new Error("Failed to approve update.");
      await loadRequests(pagination.page);
      await loadLogs(id);
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to approve update."));
    }
  }

  async function rejectRequest(id: string, reason: string) {
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
                  items.map((item) => {
                    const payload = parsePayload(item.PayloadJson);
                    const mediaItems = getMediaItems(payload);
                    const hasImages = mediaItems.length > 0;
                    return (
                    <Fragment key={item.Id}>
                    <tr>
                      <td>
                        <strong>Business ID:</strong> {item.BusinessId}
                        <div className="pub-muted">{item.BusinessName ? item.BusinessName : `CID: ${item.Cid}`}</div>
                        {hasImages ? (
                          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            {mediaItems.slice(0, 4).map((m, idx) => (
                              <img
                                key={m.PublicId || idx}
                                src={m.ThumbUrl || m.LargeUrl}
                                alt="preview"
                                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #d9e2ec" }}
                              />
                            ))}
                            {mediaItems.length > 4 ? (
                              <span className="pub-muted">+{mediaItems.length - 4} more</span>
                            ) : null}
                          </div>
                        ) : null}
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
                          <div className="app-actions" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                            <div className="app-actions">
                              <button className="btn btn-primary" type="button" onClick={() => approveRequest(item.Id, comments[item.Id] || "")}>
                                Approve
                              </button>
                              <button className="btn btn-ghost" type="button" onClick={() => rejectRequest(item.Id, reasons[item.Id] || "")}>
                                Reject
                              </button>
                            </div>
                            <input
                              className="form-input"
                              style={{ maxWidth: 280, marginTop: 6 }}
                              placeholder="Approve comment (optional)"
                              value={comments[item.Id] || ""}
                              onChange={(e) => setComments((c) => ({ ...c, [item.Id]: e.target.value }))}
                            />
                            <input
                              className="form-input"
                              style={{ maxWidth: 280, marginTop: 6 }}
                              placeholder="Rejection reason (optional)"
                              value={reasons[item.Id] || ""}
                              onChange={(e) => setReasons((r) => ({ ...r, [item.Id]: e.target.value }))}
                            />
                          </div>
                        ) : (
                          <span className="pub-muted">No actions</span>
                        )}
                        <div>
                          <button className="btn btn-ghost" type="button" onClick={() => loadLogs(item.Id)}>
                            View logs
                          </button>
                        </div>
                        <div>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={() => setExpandedId(expandedId === item.Id ? null : item.Id)}
                          >
                            {expandedId === item.Id ? "Hide details" : "View details"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === item.Id ? (
                      <tr key={`${item.Id}-details`}>
                        <td colSpan={5}>
                           <div className="app-card" style={{ margin: 0 }}>
                             <strong>Requested details (structured)</strong>
                             <div style={{ marginTop: 8 }}>
                               <StructuredDataChanges payload={payload} />
                             </div>
                             <strong style={{ display: "block", marginTop: 16 }}>
                               Requested details (JSON)
                             </strong>
                            <pre
                              className="pub-json"
                              style={{
                                marginTop: 8,
                                maxHeight: 360,
                                overflow: "auto",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {JSON.stringify(payload, null, 2) ?? "No details available."}
                            </pre>
                            {hasImages ? (
                              <div style={{ marginTop: 12 }}>
                                <strong>Image preview</strong>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                                    gap: 10,
                                    marginTop: 8,
                                  }}
                                >
                                  {mediaItems.map((m, idx) => (
                                    <img
                                      key={m.PublicId || idx}
                                      src={m.LargeUrl || m.ThumbUrl}
                                      alt="preview"
                                      style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, border: "1px solid #d9e2ec" }}
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                     ) : null}
                    </Fragment>
                   );
                 })
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

function StructuredDataChanges({ payload }: { payload: any }) {
  const fields: Array<{ mode: EditorMode; json: unknown; title: string }> = [
    { mode: "about", json: payload?.aboutJson, title: "About" },
    { mode: "businessHours", json: payload?.businessHoursJson, title: "Business Hours" },
    { mode: "menu", json: payload?.menuJson, title: "Menu" },
  ];
  const active = fields.filter((f) => {
    const model = normalize(f.json, f.mode);
    return model.categories.some((c) => c.items.length > 0);
  });
  if (active.length === 0) return <p className="app-muted">No About/Hours/Menu changes in this request.</p>;
  return (
    <>
      {active.map((f) => (
        <div key={f.mode} style={{ marginTop: 12 }}>
          <div className="app-muted" style={{ fontWeight: 600, marginBottom: 4 }}>
            {f.title}
          </div>
          <StructuredDataView mode={f.mode} model={normalize(f.json, f.mode)} />
        </div>
      ))}
    </>
  );
}
