import { useEffect, useState, FormEvent } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken } from "../../lib/auth";
import { apiUrl } from "../../lib/apiClient";
import FormMessage from "../../components/shared/FormMessage";

type Promotion = {
  id: string;
  cid?: string;
  type: string;
  status: string;
  price: number;
  startsAt: string;
  endsAt: string;
  bannerImageUrl?: string | null;
  targetUrl?: string | null;
  createdByUserId?: string;
  createdAt?: string;
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [businessToken, setBusinessToken] = useState("");
  const [type, setType] = useState("FeaturedList");
  const [status, setStatus] = useState("Draft");
  const [price, setPrice] = useState("0");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Load promotions on mount
  useEffect(() => {
    loadPromotions();
  }, []);

  async function loadPromotions() {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const response = await fetch(apiUrl("/api/promotions"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        try {
          const err = JSON.parse(text);
          throw new Error(err.message || `HTTP ${response.status}`);
        } catch {
          throw new Error(text || `HTTP ${response.status}`);
        }
      }
      const data = await response.json();
      setPromotions(data || []);
    } catch (err: any) {
      const msg = err?.message || "Unknown error";
      if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
        setError(
          "Unable to connect to API server. Please ensure it's running.",
        );
      } else {
        setError(msg);
      }
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload = {
        businessToken,
        type,
        status,
        price: Number(price),
        startsAt,
        endsAt,
        bannerImageUrl,
        targetUrl,
      };

      const response = await fetch(
        apiUrl(editingId ? `/api/promotions/${editingId}` : "/api/promotions"),
        {
          method: editingId ? "PUT" : "POST",
          headers,
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setMessage(editingId ? "Promotion updated." : "Promotion saved.");
      setEditingId(null);
      setBusinessToken("");
      setType("FeaturedList");
      setStatus("Draft");
      setPrice("0");
      setStartsAt("");
      setEndsAt("");
      setBannerImageUrl("");
      setTargetUrl("");

      loadPromotions();
    } catch (err: any) {
      setMessage(
        typeof err.message === "string" ? err.message : "Save failed.",
      );
    }
  }

  function editPromotion(p: Promotion) {
    setEditingId(p.id);
    setBusinessToken(p.cid || "");
    setType(p.type);
    setStatus(p.status);
    setPrice(String(p.price));
    setStartsAt(
      p.startsAt ? new Date(p.startsAt).toISOString().slice(0, 16) : "",
    );
    setEndsAt(p.endsAt ? new Date(p.endsAt).toISOString().slice(0, 16) : "");
    setBannerImageUrl(p.bannerImageUrl || "");
    setTargetUrl(p.targetUrl || "");
  }

  async function deletePromotion(id: string) {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    try {
      const token = getAuthToken();
      const response = await fetch(apiUrl(`/api/promotions/${id}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      loadPromotions();
    } catch (err: any) {
      setMessage(
        typeof err.message === "string" ? err.message : "Delete failed.",
      );
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setBusinessToken("");
    setType("FeaturedList");
    setStatus("Draft");
    setPrice("0");
    setStartsAt("");
    setEndsAt("");
    setBannerImageUrl("");
    setTargetUrl("");
  }

  return (
    <AppShell
      requiredRole="Admin"
      title="Promotions"
      subtitle="Create and manage paid placement records."
    >
      <div className="app-card">
        <h2 style={{ marginBottom: "1rem" }}>
          {editingId ? "Edit Promotion" : "New Promotion"}
        </h2>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Business Ref (token)</label>
            <input
              className="form-input"
              placeholder="Enter business token manually"
              value={businessToken}
              onChange={(e) => setBusinessToken(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Type</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="FeaturedList">Featured List - Home Page</option>
              <option value="BannerHome">Banner Home Page</option>
              <option value="BannerDetail">Banner Detail Page</option>
              <option value="BannerSearch">Banner Search Page</option>
            </select>
          </div>
          <div className="form-row">
            <label>Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div className="form-row">
            <label>Price</label>
            <input
              className="form-input"
              placeholder="Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Starts At</label>
            <input
              className="form-input"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Ends At</label>
            <input
              className="form-input"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Banner Image URL</label>
            <input
              className="form-input"
              placeholder="https://..."
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Target URL</label>
            <input
              className="form-input"
              placeholder="https://..."
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-primary" type="submit">
              {editingId ? "Update Promotion" : "Save Promotion"}
            </button>
            {editingId && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {message ? <FormMessage message={message} tone="success" /> : null}
      </div>

      <div className="app-card">
        <h2 style={{ marginBottom: "1rem" }}>Existing Promotions</h2>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <FormMessage message={error} tone="error" />
        ) : promotions.length === 0 ? (
          <p>No promotions found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Price</th>
                <th>Starts</th>
                <th>Ends</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id}>
                  <td>{p.type}</td>
                  <td>{p.status}</td>
                  <td>${p.price}</td>
                  <td>
                    {p.startsAt
                      ? new Date(p.startsAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {p.endsAt ? new Date(p.endsAt).toLocaleDateString() : "-"}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => editPromotion(p)}
                      style={{ marginRight: "0.5rem" }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deletePromotion(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th, .admin-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }
        .admin-table th {
          background-color: var(--surface);
          font-weight: 600;
        }
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }
        .btn-danger {
          background-color: #dc2626;
        }
        .btn-danger:hover {
          background-color: #b91c1c;
        }
        .btn-secondary {
          background-color: #6b7280;
        }
        .btn-secondary:hover {
          background-color: #4b5563;
        }
      `}</style>
    </AppShell>
  );
}
