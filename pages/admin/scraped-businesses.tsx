import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiFetch } from "../../lib/apiClient";
import FormMessage from "../../components/shared/FormMessage";

type ScrapedBusiness = {
  id: number;
  cid: string;
  name: string;
  name_hindi?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  avg_rating?: number | null;
  total_reviews?: number | null;
  is_verified?: boolean | null;
  city_name?: string | null;
  area_name?: string | null;
  created_at?: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
};

type OwnerOption = {
  id: string;
  email: string;
  name?: string | null;
};

const statusOptions = ["All", "Active", "Trial"];

export default function AdminScrapedBusinessesPage() {
  const [items, setItems] = useState<ScrapedBusiness[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
  });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize)),
    [pagination],
  );

  async function loadBusinesses(page = 1) {
    setLoading(true);
    setMessage("");
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pagination.pageSize));
      if (query.trim()) params.set("q", query.trim());
      const res = await apiFetch(`/api/admin/scraped-businesses?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load scraped businesses.");
      const data = await res.json();
      setItems(data.items ?? []);
      setPagination(data.pagination ?? { page: 1, pageSize: 20, totalCount: 0 });
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to load scraped businesses."));
    }
    setLoading(false);
  }

  async function loadOwners() {
    try {
      const token = getAuthToken();
      const res = await apiFetch("/api/admin/owners", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setOwners(data ?? []);
      }
    } catch {
      // Ignore owner loading errors
    }
  }

  async function assignOwnerToSelected() {
    if (selectedIds.size === 0 || !selectedOwnerId) {
      setMessage("Please select businesses and an owner.");
      return;
    }
    try {
      const token = getAuthToken();
      const res = await apiFetch("/api/admin/scraped-businesses/assign-owner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ businessIds: Array.from(selectedIds), userId: selectedOwnerId }),
      });
      if (!res.ok) throw new Error("Failed to assign owner.");
      setMessage(`Assigned owner to ${selectedIds.size} business(es).`);
      setSelectedIds(new Set());
      setSelectedOwnerId("");
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to assign owner."));
    }
  }

  useEffect(() => {
    void loadBusinesses(1);
    void loadOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(id: number) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function handleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  async function downloadSelectedCsv() {
    if (selectedIds.size === 0) {
      setMessage("Please select at least one business to download.");
      return;
    }
    try {
      const token = getAuthToken();
      const res = await apiFetch("/api/admin/scraped-businesses/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Failed to download CSV.");
      const csv = await res.text();
      setCsvContent(csv);
      setShowCsvModal(true);
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to download CSV."));
    }
  }

  async function downloadBlankCsv() {
    try {
      const token = getAuthToken();
      const res = await apiFetch("/api/admin/scraped-businesses/template", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to download template.");
      const csv = await res.text();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scraped-businesses-new.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to download template."));
    }
  }

  async function uploadCsvFile(file: File) {
    const text = await file.text();
    try {
      const token = getAuthToken();
      const res = await apiFetch("/api/admin/scraped-businesses/upload", {
        method: "POST",
        headers: {
          "Content-Type": "text/csv",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: text,
      });
      if (!res.ok) throw new Error("Failed to upload CSV.");
      setMessage("CSV uploaded successfully.");
      void loadBusinesses(pagination.page);
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to upload CSV."));
    }
  }

  return (
    <AppShell title="Scraped Businesses" subtitle="Manage scraped business listings." requiredRole="Admin">
      <div className="app-card">
        <div className="app-grid">
          <div className="form-row">
            <label>Search</label>
            <input
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, CID or phone"
            />
          </div>
        </div>
        <div className="app-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" type="button" onClick={() => loadBusinesses(1)} disabled={loading}>
            {loading ? "Loading..." : "Apply filters"}
          </button>
        </div>
        {message ? <FormMessage message={message} tone="error" /> : null}
      </div>

      <div className="app-card">
        <div className="app-actions" style={{ marginBottom: 12, flexWrap: "wrap", gap: "8px" }}>
          <button className="btn btn-primary" type="button" onClick={downloadSelectedCsv} disabled={selectedIds.size === 0}>
            Download CSV ({selectedIds.size})
          </button>
          <button className="btn btn-ghost" type="button" onClick={downloadBlankCsv}>
            + New Business (Template)
          </button>
          <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
            Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && void uploadCsvFile(e.target.files[0])}
            />
          </label>
          {selectedIds.size > 0 && owners.length > 0 && (
            <>
              <select
                className="form-select"
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                style={{ minWidth: 200 }}
              >
                <option value="">Assign owner to selected...</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name || o.email}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" type="button" onClick={assignOwnerToSelected} disabled={!selectedOwnerId}>
                Assign
              </button>
            </>
          )}
        </div>
        <div className="pub-table-wrap">
          <table className="pub-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === items.length && items.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Business</th>
                <th>Location</th>
                <th>Rating</th>
                <th>Verified</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6}>No businesses found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleSelect(item.id)}
                      />
                    </td>
                    <td>
                      <strong>{item.name}</strong>
                      {item.name_hindi ? <div className="pub-muted">{item.name_hindi}</div> : null}
                      <div className="pub-muted">CID: {item.cid}</div>
                    </td>
                    <td>
                      {item.address || "-"}
                      <div className="pub-muted">
                        {item.area_name && item.city_name ? `${item.area_name}, ${item.city_name}` : "-"}
                      </div>
                    </td>
                    <td>
                      {item.avg_rating ? `${Number(item.avg_rating).toFixed(1)} (${item.total_reviews})` : "-"}
                    </td>
                    <td>{item.is_verified ? "Yes" : "No"}</td>
                    <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</td>
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
            onClick={() => loadBusinesses(Math.max(1, pagination.page - 1))}
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
            onClick={() => loadBusinesses(Math.min(totalPages, pagination.page + 1))}
            disabled={pagination.page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>

      {showCsvModal && (
        <div className="modal-overlay" onClick={() => setShowCsvModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit CSV Data</h2>
            <p className="pub-muted">Modify the CSV below and upload to update records.</p>
            <textarea
              className="csv-edit-textarea"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
            />
            <div className="app-actions" style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "scraped-businesses-edit.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download Edited CSV
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowCsvModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}