import { FormEvent, useState } from "react";
import axios from "axios";
import AppShell from "../../components/app/AppShell";
import { getAuthToken } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import FormMessage from "../../components/shared/FormMessage";

type SearchBusinessItem = {
  businessToken?: string;
  name: string;
  address?: string | null;
  citySlug?: string | null;
  areaSlug?: string | null;
};

export default function PromotionsPage() {
  const [businessToken, setBusinessToken] = useState("");
  const [businessName, setBusinessName] = useState("");
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
      const token = getAuthToken();
      await axios.post(
        apiUrl("/api/promotions"),
        {
          businessToken,
          type,
          status,
          price: Number(price),
          startsAt,
          endsAt,
          bannerImageUrl: bannerImageUrl,
          targetUrl: targetUrl,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setMessage("Promotion saved.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Save failed."));
    }
  }

  return (
    <AppShell
      requiredRole="Admin"
      title="Promotions"
      subtitle="Create and manage paid placement records."
    >
      <div className="app-card">
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Business Name</label>
            <input
              className="form-input"
              placeholder="Enter business name manually"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
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
              <option value="BannerHome">Banner - Home Page</option>
              <option value="BannerDetail">
                Banner on Details Page (Bottom)
              </option>
              <option value="BannerSearch">Search Result</option>
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
          <button className="btn btn-primary" type="submit">
            Save Promotion
          </button>
        </form>
      </div>
      {message ? <FormMessage message={message} tone="success" /> : null}
    </AppShell>
  );
}
