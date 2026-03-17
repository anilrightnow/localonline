import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import AppShell from "../../components/app/AppShell";
import { getApiErrorMessage } from "../../lib/apiError";

type SearchBusinessItem = {
  businessToken: string;
  name: string;
  address?: string | null;
  citySlug?: string | null;
  areaSlug?: string | null;
};

export default function PromotionsPage() {
  const [businessToken, setBusinessToken] = useState("");
  const [businessQuery, setBusinessQuery] = useState("");
  const [businessOptions, setBusinessOptions] = useState<SearchBusinessItem[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<SearchBusinessItem | null>(null);
  const [type, setType] = useState("FeaturedList");
  const [status, setStatus] = useState("Draft");
  const [price, setPrice] = useState("0");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/promotions",
        {
          businessToken,
          type,
          status,
          price: Number(price),
          startsAt,
          endsAt,
          bannerImageUrl: bannerImageUrl || null,
          targetUrl: targetUrl || null,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setMessage("Promotion saved.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Save failed."));
    }
  }

  useEffect(() => {
    const term = businessQuery.trim();
    if (term.length < 2) {
      setBusinessOptions([]);
      return;
    }
    const token = localStorage.getItem("token");
    axios
      .get("/api/owner-listings/search", {
        params: { q: term, limit: 15 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setBusinessOptions(res.data ?? []))
      .catch(() => setBusinessOptions([]));
  }, [businessQuery]);

  return (
    <AppShell requiredRole="Admin" title="Promotions" subtitle="Create and manage paid placement records.">
      <div className="app-card">
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Business</label>
            <input
              className="form-input"
              placeholder="Type business name"
              value={businessQuery}
              onChange={(e) => {
                setBusinessQuery(e.target.value);
                setSelectedBusiness(null);
                setBusinessToken("");
              }}
            />
            {selectedBusiness ? (
              <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center" }}>
                <span>
                  Selected: <strong>{selectedBusiness.name}</strong>
                  {selectedBusiness.areaSlug ? `, ${selectedBusiness.areaSlug}` : ""}
                  {selectedBusiness.citySlug ? `, ${selectedBusiness.citySlug}` : ""}
                </span>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setSelectedBusiness(null);
                    setBusinessQuery("");
                    setBusinessToken("");
                  }}
                >
                  Clear
                </button>
              </div>
            ) : null}
            {businessOptions.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {businessOptions.map((option) => (
                  <button
                    key={option.businessToken}
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => {
                      setSelectedBusiness(option);
                      setBusinessQuery(option.name);
                      setBusinessToken(option.businessToken);
                      setBusinessOptions([]);
                    }}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="form-row">
            <label>Business Ref (token)</label>
            <input className="form-input" placeholder="Auto-filled when selected" value={businessToken} onChange={(e) => setBusinessToken(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Type</label>
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="FeaturedList">FeaturedList</option>
              <option value="Banner">Banner</option>
            </select>
          </div>
          <div className="form-row">
            <label>Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div className="form-row">
            <label>Price</label>
            <input className="form-input" placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Starts At</label>
            <input className="form-input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Ends At</label>
            <input className="form-input" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Banner Image URL</label>
            <input className="form-input" placeholder="https://..." value={bannerImageUrl} onChange={(e) => setBannerImageUrl(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Target URL</label>
            <input className="form-input" placeholder="https://..." value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">Save Promotion</button>
        </form>
      </div>
      {message ? <div className="msg msg-success">{message}</div> : null}
    </AppShell>
  );
}
