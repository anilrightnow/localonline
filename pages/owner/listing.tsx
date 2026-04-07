import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { getAuthToken, setAuthTokenCookie, useRequireAuth } from "../../lib/auth";
import AppShell from "../../components/app/AppShell";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import { getUserSessionFromToken, hasRole } from "../../lib/session";
import FormMessage from "../../components/shared/FormMessage";

type SearchBusinessItem = {
  businessToken: string;
  name: string;
  address?: string | null;
  citySlug?: string | null;
  areaSlug?: string | null;
};

type BusinessDetail = {
  businessToken: string;
  name?: string | null;
  nameHindi?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  websiteLink?: string | null;
  menuLink?: string | null;
  description?: string | null;
  avgRating?: number | null;
  totalReviews?: number | null;
  placeUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isVerified?: boolean | null;
  actionsJson?: string;
  aboutJson?: string;
  businessHoursJson?: string;
  reviewJson?: string;
  mediaJson?: string;
  menuJson?: string;
  fullJson?: string;
  areaIds?: number[];
  categoryIds?: number[];
  planName?: string | null;
};

type MasterOption = { id: number; name: string; slug?: string | null };

type AnalyticsResponse = {
  totalsByType: Array<{ eventType: string; total: number }>;
};

type JsonPrimitiveType = "string" | "number" | "boolean" | "null";
type JsonPathRow = { id: string; path: string; valueType: JsonPrimitiveType; value: string };

export default function OwnerListingPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const session = useMemo(() => getUserSessionFromToken(getAuthToken()), []);
  const isAdmin = hasRole(session, "Admin");
  const isOwner = session.roles.includes("Owner");

  const [query, setQuery] = useState("");
  const [searchItems, setSearchItems] = useState<SearchBusinessItem[]>([]);
  const [selected, setSelected] = useState<SearchBusinessItem | null>(null);
  const [planName, setPlanName] = useState("Free");
  const [message, setMessage] = useState("");
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  const [name, setName] = useState("");
  const [nameHindi, setNameHindi] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [menuLink, setMenuLink] = useState("");
  const [description, setDescription] = useState("");
  const [placeUrl, setPlaceUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [avgRating, setAvgRating] = useState("");
  const [totalReviews, setTotalReviews] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [areaOptions, setAreaOptions] = useState<MasterOption[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<MasterOption[]>([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<MasterOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<MasterOption[]>([]);
  const [actionsJson, setActionsJson] = useState("{}");
  const [aboutJson, setAboutJson] = useState("[]");
  const [businessHoursJson, setBusinessHoursJson] = useState("[]");
  const [reviewJson, setReviewJson] = useState("{}");
  const [mediaJson, setMediaJson] = useState("[]");
  const [menuJson, setMenuJson] = useState("[]");
  const [fullJson, setFullJson] = useState("{}");
  const [isVerified, setIsVerified] = useState(false);

  async function searchBusinesses() {
    setMessage("");
    try {
      const token = getAuthToken();
      const response = await axios.get<SearchBusinessItem[]>(
        apiUrl("/api/owner-listings/search"),
        {
          params: { q: query, limit: 20 },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setSearchItems(response.data ?? []);
      if ((response.data ?? []).length === 0) {
        setMessage("No matching business found.");
      }
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Business search failed."));
      setSearchItems([]);
    }
  }

  async function loadBusiness(businessToken: string) {
    setMessage("");
    try {
      const token = getAuthToken();
      const response = await axios.get<BusinessDetail>(
        apiUrl(`/api/owner-listings/businesses/${encodeURIComponent(businessToken)}`),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const b = response.data;
      setPlanName(b.planName ?? "Free");
      setName(b.name ?? "");
      setNameHindi(b.nameHindi ?? "");
      setAddress(b.address ?? "");
      setPhone(b.phone ?? "");
      setWebsite(b.website ?? "");
      setWebsiteLink(b.websiteLink ?? "");
      setMenuLink(b.menuLink ?? "");
      setDescription(b.description ?? "");
      setPlaceUrl(b.placeUrl ?? "");
      setLatitude(b.latitude == null ? "" : String(b.latitude));
      setLongitude(b.longitude == null ? "" : String(b.longitude));
      setAvgRating(b.avgRating == null ? "" : String(b.avgRating));
      setTotalReviews(b.totalReviews == null ? "" : String(b.totalReviews));
      await loadSelectedAreas(b.areaIds ?? []);
      await loadSelectedCategories(b.categoryIds ?? []);
      setActionsJson(b.actionsJson ?? "{}");
      setAboutJson(b.aboutJson ?? "[]");
      setBusinessHoursJson(b.businessHoursJson ?? "[]");
      setReviewJson(b.reviewJson ?? "{}");
      setMediaJson(b.mediaJson ?? "[]");
      setMenuJson(b.menuJson ?? "[]");
      setFullJson(b.fullJson ?? "{}");
      setIsVerified(Boolean(b.isVerified));
      setMessage("Business loaded.");
      await loadAnalytics(businessToken, days);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Load failed."));
    }
  }

  async function loadSelectedAreas(ids: number[]) {
    if (!ids.length) {
      setSelectedAreas([]);
      return;
    }
    const token = getAuthToken();
    const response = await axios.get<MasterOption[]>(apiUrl("/api/master/areas"), {
      params: { ids: ids.join(",") },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setSelectedAreas(response.data ?? []);
  }

  async function loadSelectedCategories(ids: number[]) {
    if (!ids.length) {
      setSelectedCategories([]);
      return;
    }
    const token = getAuthToken();
    const response = await axios.get<MasterOption[]>(apiUrl("/api/master/categories"), {
      params: { ids: ids.join(",") },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setSelectedCategories(response.data ?? []);
  }

  async function searchAreas() {
    const token = getAuthToken();
    const response = await axios.get<MasterOption[]>(apiUrl("/api/master/areas"), {
      params: { q: areaQuery, limit: 20 },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setAreaOptions(response.data ?? []);
  }

  async function searchCategories() {
    const token = getAuthToken();
    const response = await axios.get<MasterOption[]>(apiUrl("/api/master/categories"), {
      params: { q: categoryQuery, limit: 20 },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setCategoryOptions(response.data ?? []);
  }

  async function saveBusiness(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!selected?.businessToken) {
      setMessage("Select a business first.");
      return;
    }
    try {
      const token = getAuthToken();
      const response = await axios.put(
        apiUrl(`/api/owner-listings/businesses/${encodeURIComponent(selected.businessToken)}`),
        {
          name,
          nameHindi,
          address,
          phone,
          website,
          websiteLink,
          menuLink,
          description,
          placeUrl,
          latitude: toNullableNumber(latitude),
          longitude: toNullableNumber(longitude),
          avgRating: toNullableNumber(avgRating),
          totalReviews: toNullableInt(totalReviews),
          areaIds: selectedAreas.map((x) => x.id),
          categoryIds: selectedCategories.map((x) => x.id),
          isVerified,
          actionsJson: parseJsonOrNull(actionsJson),
          aboutJson: parseJsonOrNull(aboutJson),
          businessHoursJson: parseJsonOrNull(businessHoursJson),
          reviewJson: parseJsonOrNull(reviewJson),
          mediaJson: parseJsonOrNull(mediaJson),
          menuJson: parseJsonOrNull(menuJson),
          fullJson: parseJsonOrNull(fullJson),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setMessage(response.data?.message ?? "Update submitted.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Save failed."));
    }
  }

  async function createBusiness() {
    setMessage("");
    try {
      const token = getAuthToken();
      const response = await axios.post(
        apiUrl("/api/owner-listings/businesses"),
        {
          name: "New Business",
          aboutJson: [],
          businessHoursJson: [],
          mediaJson: [],
          menuJson: [],
          reviewJson: {},
          fullJson: {},
          actionsJson: {},
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const businessToken = String(response.data?.businessToken ?? "");
      setMessage("Business created successfully.");
      if (businessToken) {
        const created: SearchBusinessItem = { businessToken, name: "New Business" };
        setSelected(created);
        setSearchItems((prev) => [created, ...prev]);
        await loadBusiness(businessToken);
      }
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Create business failed."));
    }
  }

  const canEditGallery = isAdmin || planName.toLowerCase() === "popular";

  async function registerAsOwner() {
    setMessage("");
    try {
      const token = getAuthToken();
      const response = await fetch(apiUrl("/api/owner/register"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Owner registration failed.");
      }
      const refreshRes = await fetch(apiUrl("/api/auth/refresh"), { method: "POST" });
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as { access_token?: string };
        if (data.access_token) {
          setAuthTokenCookie(data.access_token);
        }
      }
      setMessage("Owner access enabled. Reloading...");
      window.location.reload();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Owner registration failed."));
    }
  }

  async function loadAnalytics(businessToken: string, targetDays: number) {
    try {
    const token = getAuthToken();
      const response = await axios.get<AnalyticsResponse>(
        apiUrl(`/api/owner-listings/businesses/${encodeURIComponent(businessToken)}/analytics`),
        {
          params: { days: targetDays },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setAnalytics(response.data);
    } catch {
      setAnalytics(null);
    }
  }

  useEffect(() => {
    const tokenFromQuery = typeof router.query.businessToken === "string" ? router.query.businessToken.trim() : "";
    if (!tokenFromQuery || !isAuthenticated) return;
    setSelected((prev) => prev ?? { businessToken: tokenFromQuery, name: "Selected Business" });
    void loadBusiness(tokenFromQuery);
  }, [router.query.businessToken, isAuthenticated]);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  return (
    <AppShell title="Business Add/Update" subtitle="Edits are reviewed by Admin/SuperAdmin before going live.">
      {message ? <FormMessage message={message} tone="success" /> : null}

      {!isAdmin && !isOwner ? (
        <div className="app-card">
          <h2>Register as Owner</h2>
          <p>Register as an owner to add new business listings.</p>
          <div className="app-actions">
            <button className="btn btn-primary" type="button" onClick={() => void registerAsOwner()}>
              Register as Owner
            </button>
          </div>
        </div>
      ) : null}

      <div className="app-card">
        <h2>Select Business</h2>
        <p>Search and select a business to manage.</p>
        <div className="app-actions">
          <input className="form-input" style={{ maxWidth: 440 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, area, city..." />
          <button className="btn btn-primary" type="button" onClick={() => void searchBusinesses()}>Search</button>
        </div>
        {searchItems.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #d9e2ec", padding: "8px 4px" }}>Name</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #d9e2ec", padding: "8px 4px" }}>Business Ref</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #d9e2ec", padding: "8px 4px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {searchItems.map((item) => (
                <tr key={item.businessToken}>
                  <td style={{ borderBottom: "1px solid #edf2f7", padding: "8px 4px" }}>{item.name}</td>
                  <td style={{ borderBottom: "1px solid #edf2f7", padding: "8px 4px" }}>{item.businessToken}</td>
                  <td style={{ borderBottom: "1px solid #edf2f7", padding: "8px 4px" }}>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => {
                        setSelected(item);
                        void loadBusiness(item.businessToken);
                      }}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {isAdmin || isOwner ? (
        <div className="app-card">
          <h2>Add New Business</h2>
          <p>Creates a new row in `scraped_businesses`.</p>
          <div className="app-actions">
            <button className="btn btn-primary" type="button" onClick={() => void createBusiness()}>
              Create Business
            </button>
          </div>
        </div>
      ) : null}

      <div className="app-card">
        <h2>Edit Business</h2>
        <p><strong>Plan:</strong> {planName} {isAdmin ? "(Admin/SuperAdmin can edit all selected businesses)" : ""}</p>
        <form onSubmit={saveBusiness}>
          <div className="app-grid">
            <div className="form-row"><label>Name</label><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="form-row"><label>Name Hindi</label><input className="form-input" value={nameHindi} onChange={(e) => setNameHindi(e.target.value)} /></div>
            <div className="form-row"><label>Address</label><input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div className="form-row"><label>Phone</label><input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="form-row"><label>Website</label><input className="form-input" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
            <div className="form-row"><label>Website Link</label><input className="form-input" value={websiteLink} onChange={(e) => setWebsiteLink(e.target.value)} /></div>
            <div className="form-row"><label>Menu Link</label><input className="form-input" value={menuLink} onChange={(e) => setMenuLink(e.target.value)} /></div>
            <div className="form-row"><label>Description</label><input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="form-row"><label>Avg Rating</label><input className="form-input" value={avgRating} onChange={(e) => setAvgRating(e.target.value)} /></div>
            <div className="form-row"><label>Total Reviews</label><input className="form-input" value={totalReviews} onChange={(e) => setTotalReviews(e.target.value)} /></div>
            <div className="form-row"><label>Place URL</label><input className="form-input" value={placeUrl} onChange={(e) => setPlaceUrl(e.target.value)} /></div>
            <div className="form-row"><label>Latitude</label><input className="form-input" value={latitude} onChange={(e) => setLatitude(e.target.value)} /></div>
            <div className="form-row"><label>Longitude</label><input className="form-input" value={longitude} onChange={(e) => setLongitude(e.target.value)} /></div>
            <div className="form-row">
              <label>Areas</label>
              <div className="app-grid" style={{ gridTemplateColumns: "2fr auto" }}>
                <input className="form-input" value={areaQuery} onChange={(e) => setAreaQuery(e.target.value)} placeholder="Search areas by name" />
                <button className="btn btn-ghost" type="button" onClick={() => void searchAreas()}>Search</button>
              </div>
              <div className="app-actions" style={{ flexWrap: "wrap" }}>
                {selectedAreas.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setSelectedAreas((prev) => prev.filter((x) => x.id !== area.id))}
                  >
                    {area.name} x
                  </button>
                ))}
              </div>
              {areaOptions.length ? (
                <div className="app-card" style={{ marginTop: 8 }}>
                  {areaOptions.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      className="btn btn-ghost"
                      style={{ marginRight: 8, marginBottom: 8 }}
                      onClick={() => setSelectedAreas((prev) => (prev.some((x) => x.id === area.id) ? prev : [...prev, area]))}
                    >
                      {area.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="form-row">
              <label>Categories</label>
              <div className="app-grid" style={{ gridTemplateColumns: "2fr auto" }}>
                <input className="form-input" value={categoryQuery} onChange={(e) => setCategoryQuery(e.target.value)} placeholder="Search categories by name" />
                <button className="btn btn-ghost" type="button" onClick={() => void searchCategories()}>Search</button>
              </div>
              <div className="app-actions" style={{ flexWrap: "wrap" }}>
                {selectedCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setSelectedCategories((prev) => prev.filter((x) => x.id !== cat.id))}
                  >
                    {cat.name} x
                  </button>
                ))}
              </div>
              {categoryOptions.length ? (
                <div className="app-card" style={{ marginTop: 8 }}>
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className="btn btn-ghost"
                      style={{ marginRight: 8, marginBottom: 8 }}
                      onClick={() => setSelectedCategories((prev) => (prev.some((x) => x.id === cat.id) ? prev : [...prev, cat]))}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="form-row">
            <label><input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} /> Verified</label>
          </div>

          <h3>JSON Columns (saved as current structure)</h3>
          <JsonPathEditor label="actions_json" value={actionsJson} onChange={setActionsJson} rootType="object" />
          <JsonPathEditor label="about_json" value={aboutJson} onChange={setAboutJson} rootType="array" />
          <JsonPathEditor label="business_hours_json" value={businessHoursJson} onChange={setBusinessHoursJson} rootType="array" />
          <JsonPathEditor label="review_json" value={reviewJson} onChange={setReviewJson} rootType="object" />
          <JsonPathEditor
            label="media_json"
            value={mediaJson}
            onChange={setMediaJson}
            rootType="array"
            disabled={!canEditGallery}
            helperText={!canEditGallery ? "Gallery edits require the Popular plan." : undefined}
          />
          <JsonPathEditor label="menu_json" value={menuJson} onChange={setMenuJson} rootType="array" />
          <JsonPathEditor label="full_json" value={fullJson} onChange={setFullJson} rootType="object" />

          <div className="app-actions">
            <button className="btn btn-primary" type="submit" disabled={!selected?.businessToken}>
              {isAdmin ? "Save in Scraped Tables" : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>

      <div className="app-card">
        <h2>Business Analytics</h2>
        <div className="app-actions">
          <select className="form-select" style={{ maxWidth: 180 }} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button className="btn btn-ghost" type="button" disabled={!selected?.businessToken} onClick={() => selected?.businessToken && void loadAnalytics(selected.businessToken, days)}>
            Refresh
          </button>
        </div>
        {!analytics ? <p>No analytics available.</p> : (
          <ul>
            {analytics.totalsByType.map((x) => (
              <li key={x.eventType}>{x.eventType}: {x.total}</li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function JsonPathEditor({
  label,
  value,
  onChange,
  rootType,
  disabled = false,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rootType: "object" | "array";
  disabled?: boolean;
  helperText?: string;
}) {
  const [rows, setRows] = useState<JsonPathRow[]>(() => flattenJsonToRows(value));
  const [error, setError] = useState("");

  useEffect(() => {
    setRows(flattenJsonToRows(value));
  }, [value]);

  function updateRows(next: JsonPathRow[]) {
    setRows(next);
    try {
      const jsonText = buildJsonFromRows(next, rootType);
      onChange(jsonText);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid row values.");
    }
  }

  return (
    <div className="form-row">
      <label>{label}</label>
      <div style={{ border: "1px solid #d9e2ec", borderRadius: 10, padding: 12 }}>
        <p className="app-muted" style={{ marginTop: 0 }}>
          Add nested values using field paths like `contact.phone`, `timings[0].day`, `meta.tags[2]`.
        </p>
        {helperText ? <p className="app-muted">{helperText}</p> : null}
        {rows.map((row, index) => (
          <div key={row.id} className="app-grid" style={{ marginBottom: 8, gridTemplateColumns: "2fr 1fr 2fr auto" }}>
            <input
              className="form-input"
              placeholder={rootType === "array" ? "[0].field" : "field.subField"}
              value={row.path}
              disabled={disabled}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, path: e.target.value };
                updateRows(next);
              }}
            />
            <select
              className="form-select"
              value={row.valueType}
              disabled={disabled}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, valueType: e.target.value as JsonPrimitiveType };
                updateRows(next);
              }}
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="null">null</option>
            </select>
            {row.valueType === "boolean" ? (
              <select
                className="form-select"
                value={row.value.toLowerCase() === "true" ? "true" : "false"}
                disabled={disabled}
                onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, value: e.target.value };
                  updateRows(next);
                }}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <input
                className="form-input"
                placeholder={row.valueType === "null" ? "null value ignored" : "value"}
                value={row.value}
                disabled={disabled || row.valueType === "null"}
                onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, value: e.target.value };
                  updateRows(next);
                }}
              />
            )}
            <button
              className="btn btn-ghost"
              type="button"
              disabled={disabled}
              onClick={() => updateRows(rows.filter((x) => x.id !== row.id))}
            >
              Remove
            </button>
          </div>
        ))}
        <div className="app-actions">
          <button
            className="btn btn-ghost"
            type="button"
            disabled={disabled}
            onClick={() =>
              updateRows([
                ...rows,
                { id: `${Date.now()}-${Math.random()}`, path: rootType === "array" ? `[${rows.length}]` : "", valueType: "string", value: "" },
              ])
            }
          >
            Add Field
          </button>
        </div>
        {error ? <FormMessage message={error} tone="error" /> : null}
        <textarea className="form-textarea" value={value} rows={5} readOnly style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

function flattenJsonToRows(raw: string): JsonPathRow[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const out: JsonPathRow[] = [];
    flattenNode(parsed, "", out);
    return out;
  } catch {
    return [];
  }
}

function flattenNode(value: unknown, path: string, out: JsonPathRow[]) {
  if (value === null) {
    out.push({ id: `${path}-null`, path, valueType: "null", value: "" });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const nextPath = path ? `${path}[${index}]` : `[${index}]`;
      flattenNode(item, nextPath, out);
    });
    return;
  }
  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      const nextPath = path ? `${path}.${key}` : key;
      flattenNode(item, nextPath, out);
    });
    return;
  }
  if (typeof value === "number") {
    out.push({ id: `${path}-n`, path, valueType: "number", value: String(value) });
    return;
  }
  if (typeof value === "boolean") {
    out.push({ id: `${path}-b`, path, valueType: "boolean", value: String(value) });
    return;
  }
  out.push({ id: `${path}-s`, path, valueType: "string", value: String(value) });
}

function buildJsonFromRows(rows: JsonPathRow[], rootType: "object" | "array"): string {
  const root: unknown = rootType === "array" ? [] : {};
  for (const row of rows) {
    const path = row.path.trim();
    if (!path) continue;
    const segments = parsePath(path);
    if (segments.length === 0) continue;
    setPathValue(root as Record<string, unknown> | unknown[], segments, parseTypedValue(row));
  }
  return JSON.stringify(root, null, 2);
}

function parseTypedValue(row: JsonPathRow): unknown {
  if (row.valueType === "null") return null;
  if (row.valueType === "boolean") return row.value.toLowerCase() === "true";
  if (row.valueType === "number") {
    const n = Number(row.value);
    if (!Number.isFinite(n)) {
      throw new Error(`Invalid number for path "${row.path}".`);
    }
    return n;
  }
  return row.value;
}

function parsePath(input: string): Array<string | number> {
  const parts: Array<string | number> = [];
  const pattern = /([^[.\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    if (match[1]) {
      parts.push(match[1]);
    } else if (match[2]) {
      parts.push(Number(match[2]));
    }
  }
  return parts;
}

function setPathValue(root: Record<string, unknown> | unknown[], segments: Array<string | number>, value: unknown) {
  let current: any = root;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const next = segments[i + 1];
    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        throw new Error("Array path is invalid for current JSON structure.");
      }
      if (current[segment] == null || typeof current[segment] !== "object") {
        current[segment] = typeof next === "number" ? [] : {};
      }
      current = current[segment];
    } else {
      if (Array.isArray(current)) {
        throw new Error("Object path is invalid for current JSON structure.");
      }
      if (current[segment] == null || typeof current[segment] !== "object") {
        current[segment] = typeof next === "number" ? [] : {};
      }
      current = current[segment];
    }
  }

  const last = segments[segments.length - 1];
  if (typeof last === "number") {
    if (!Array.isArray(current)) {
      throw new Error("Final array path is invalid for current JSON structure.");
    }
    current[last] = value;
    return;
  }
  if (Array.isArray(current)) {
    throw new Error("Final object path is invalid for current JSON structure.");
  }
  current[last] = value;
}

function toNumberArray(value: string): number[] {
  return value
    .split(",")
    .map((x) => Number.parseInt(x.trim(), 10))
    .filter((x) => Number.isInteger(x) && x > 0);
}

function toNullableNumber(value: string): number | null {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function toNullableInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) ? n : null;
}

function parseJsonOrNull(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed);
}
