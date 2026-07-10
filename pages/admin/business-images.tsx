import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiFetch } from "../../lib/apiClient";
import FormMessage from "../../components/shared/FormMessage";
import BusinessImageUploader, { type MediaItem } from "../../components/shared/BusinessImageUploader";

type BusinessOption = {
  id: number;
  cid: string;
  name: string;
  address?: string | null;
  city_name?: string | null;
  area_name?: string | null;
};

export default function AdminBusinessImagesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BusinessOption[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessOption | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [planName, setPlanName] = useState("Free");
  const [imageLimit, setImageLimit] = useState(2);

  const businessToken = useMemo(
    () => (selectedBusiness ? `b${selectedBusiness.id}` : ""),
    [selectedBusiness],
  );

  const isValidBusinessToken = businessToken.trim().length > 0;

  async function searchBusinesses() {
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }
    if (!/^\d+$/.test(term) && term.length < 2) return;

    setLoading(true);
    setMessage("");
    try {
      const token = getAuthToken();
      const q = Number.isFinite(Number(term)) ? term : term;
      const params = new URLSearchParams();
      params.set("q", encodeURIComponent(q));
      const res = await apiFetch(`/api/admin/scraped-businesses?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to search businesses.");
      const data = await res.json();
      const items = (data.items ?? []).map((item: any) => ({
        id: Number(item.id),
        cid: item.cid,
        name: item.name,
        address: item.address || null,
        city_name: item.city_name || null,
        area_name: item.area_name || null,
      }));
      setResults(items);
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, "Failed to search businesses."));
    } finally {
      setLoading(false);
    }
  }

  function selectBusiness(business: BusinessOption) {
    setSelectedBusiness(business);
    setResults([]);
    setQuery("");
    setMedia([]);
    setMessage("");
  }

  function handleMediaChange(next: MediaItem[]) {
    setMedia(next);
  }

  return (
    <AppShell
      title="Business Images"
      subtitle="Search a business and manage its gallery."
      requiredRole="Admin"
    >
      <div className="app-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Search Business</h3>
        <div className="app-actions">
          <input
            className="form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void searchBusinesses();
            }}
            placeholder="Search by id, cid, name or phone..."
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void searchBusinesses()}
            disabled={loading || !query.trim()}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {results.length > 0 && !selectedBusiness && (
          <div
            style={{
              marginTop: 12,
              border: "1px solid #d9e2ec",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {results.map((business) => (
              <button
                key={business.id}
                type="button"
                onClick={() => selectBusiness(business)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "#fff",
                  border: "none",
                  borderBottom: "1px solid #eef2f5",
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                <strong>{business.name || "Unnamed Business"}</strong>
                <div style={{ fontSize: 12, color: "#6b7785" }}>
                  {business.id} {business.cid}
                  {business.area_name ? ` ${business.area_name}` : ""}
                  {business.city_name ? `, ${business.city_name}` : ""}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedBusiness && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              border: "1px solid #bcd15f",
              borderRadius: 8,
              background: "#f6ffe8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <strong>Selected:</strong> {selectedBusiness.name || "Unnamed Business"}
              <div style={{ fontSize: 12 }}>
                {selectedBusiness.id} {selectedBusiness.cid}
                {selectedBusiness.area_name ? ` ${selectedBusiness.area_name}` : ""}
                {selectedBusiness.city_name ? `, ${selectedBusiness.city_name}` : ""}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSelectedBusiness(null);
                setMedia([]);
                setMessage("");
              }}
            >
              Change
            </button>
          </div>
        )}
      </div>

      {message && (
        <FormMessage
          message={message}
          tone={message.toLowerCase().includes("fail") ? "error" : "success"}
        />
      )}

      {isValidBusinessToken && selectedBusiness && (
        <BusinessImageUploader
          businessToken={businessToken}
          planName={planName}
          imageLimit={imageLimit}
          canEdit
          isAdmin
          initialMedia={media}
          onMediaChange={handleMediaChange}
        />
      )}
    </AppShell>
  );
}
