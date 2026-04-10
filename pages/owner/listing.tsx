import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  getAuthToken,
  setAuthTokenCookie,
  useRequireAuth,
} from "../../lib/auth";
import AppShell from "../../components/app/AppShell";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import { getUserSessionFromToken, hasRole } from "../../lib/session";
import FormMessage from "../../components/shared/FormMessage";
import { JsonEditor } from "json-edit-react";

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
  const [selectedCategories, setSelectedCategories] = useState<MasterOption[]>(
    [],
  );
  const [actionsJson, setActionsJson] = useState("{}");
  const [aboutJson, setAboutJson] = useState("[]");
  const [businessHoursJson, setBusinessHoursJson] = useState("[]");
  const [reviewJson, setReviewJson] = useState("{}");
  const [mediaJson, setMediaJson] = useState("[]");
  const [menuJson, setMenuJson] = useState("[]");
  const [fullJson, setFullJson] = useState("{}");
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const [cities, setCities] = useState<MasterOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<MasterOption | null>(null);
  const [areas, setAreas] = useState<MasterOption[]>([]);
  const [selectedArea, setSelectedArea] = useState<MasterOption | null>(null);
  const [categories, setCategories] = useState<MasterOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MasterOption | null>(
    null,
  );

  async function searchBusinesses() {
    setMessage("");
    try {
      const token = getAuthToken();
      const params: any = { q: query, limit: 20 };
      if (selectedCity?.slug) {
        params.citySlug = selectedCity.slug;
      }
      if (selectedArea?.slug) {
        params.areaSlug = selectedArea.slug;
      }
      if (selectedCategory?.slug) {
        params.categorySlug = selectedCategory.slug;
      }
      const response = await axios.get<SearchBusinessItem[]>(
        apiUrl("/api/owner-listings/search"),
        {
          params,
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

  async function loadCities() {
    try {
      const token = getAuthToken();
      const response = await axios.get<MasterOption[]>(
        apiUrl("/api/master/cities"),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setCities(response.data ?? []);
    } catch (error) {
      setMessage(
        "Failed to load cities: " + getApiErrorMessage(error, "Unknown error"),
      );
    }
  }

  async function loadAreas() {
    try {
      const token = getAuthToken();
      const response = await axios.get<MasterOption[]>(
        apiUrl("/api/master/areas"),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setAreas(response.data ?? []);
    } catch (error) {
      setMessage(
        "Failed to load areas: " + getApiErrorMessage(error, "Unknown error"),
      );
    }
  }

  async function loadCategories() {
    try {
      const token = getAuthToken();
      const response = await axios.get<MasterOption[]>(
        apiUrl("/api/master/categories"),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setCategories(response.data ?? []);
    } catch (error) {
      setMessage(
        "Failed to load categories: " +
          getApiErrorMessage(error, "Unknown error"),
      );
    }
  }

  async function loadBusiness(businessToken: string) {
    setMessage("");
    try {
      const token = getAuthToken();
      const response = await axios.get<BusinessDetail>(
        apiUrl(
          `/api/owner-listings/businesses/${encodeURIComponent(businessToken)}`,
        ),
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
    const response = await axios.get<MasterOption[]>(
      apiUrl("/api/master/areas"),
      {
        params: { ids: ids.join(",") },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    setSelectedAreas(response.data ?? []);
  }

  async function loadSelectedCategories(ids: number[]) {
    if (!ids.length) {
      setSelectedCategories([]);
      return;
    }
    const token = getAuthToken();
    const response = await axios.get<MasterOption[]>(
      apiUrl("/api/master/categories"),
      {
        params: { ids: ids.join(",") },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    setSelectedCategories(response.data ?? []);
  }

  async function searchAreas() {
    const token = getAuthToken();
    const response = await axios.get<MasterOption[]>(
      apiUrl("/api/master/areas"),
      {
        params: { q: areaQuery, limit: 20 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    setAreaOptions(response.data ?? []);
  }

  async function searchCategories() {
    const token = getAuthToken();
    const response = await axios.get<MasterOption[]>(
      apiUrl("/api/master/categories"),
      {
        params: { q: categoryQuery, limit: 20 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
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
        apiUrl(
          `/api/owner-listings/businesses/${encodeURIComponent(selected.businessToken)}`,
        ),
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
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
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
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const businessToken = String(response.data?.businessToken ?? "");
      setMessage("Business created successfully.");
      if (businessToken) {
        const created: SearchBusinessItem = {
          businessToken,
          name: "New Business",
        };
        setSelected(created);
        setSearchItems((prev) => [created, ...prev]);
        await loadBusiness(businessToken);
      }
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Create business failed."));
    }
  }

  const canEditGallery = isAdmin || planName.toLowerCase() === "popular";

  const tabs = [
    {
      key: "about",
      label: "About",
      value: aboutJson,
      onChange: setAboutJson,
      rootType: "array",
    },
    {
      key: "businessHours",
      label: "Business Hours",
      value: businessHoursJson,
      onChange: setBusinessHoursJson,
      rootType: "array",
    },
    {
      key: "review",
      label: "Reviews",
      value: reviewJson,
      onChange: setReviewJson,
      rootType: "object",
    },
    {
      key: "media",
      label: "Media",
      value: mediaJson,
      onChange: setMediaJson,
      rootType: "array",
      disabled: !canEditGallery,
      helperText: !canEditGallery
        ? "Gallery edits require the Popular plan."
        : undefined,
    },
    {
      key: "menu",
      label: "Menu",
      value: menuJson,
      onChange: setMenuJson,
      rootType: "array",
    },
    {
      key: "full",
      label: "Full",
      value: fullJson,
      onChange: setFullJson,
      rootType: "object",
    },
    {
      key: "actions",
      label: "Actions",
      value: actionsJson,
      onChange: setActionsJson,
      rootType: "object",
    },
  ];

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
      const refreshRes = await fetch(apiUrl("/api/auth/refresh"), {
        method: "POST",
      });
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
        apiUrl(
          `/api/owner-listings/businesses/${encodeURIComponent(businessToken)}/analytics`,
        ),
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
    const tokenFromQuery =
      typeof router.query.businessToken === "string"
        ? router.query.businessToken.trim()
        : "";
    if (!tokenFromQuery || !isAuthenticated) return;
    setSelected(
      (prev) =>
        prev ?? { businessToken: tokenFromQuery, name: "Selected Business" },
    );
    void loadBusiness(tokenFromQuery);
  }, [router.query.businessToken, isAuthenticated]);

  useEffect(() => {
    void loadCities();
    void loadAreas();
    void loadCategories();
  }, []);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  return (
    <AppShell
      title="Business Add/Update"
      subtitle="Edits are reviewed by Admin/SuperAdmin before going live."
    >
      {message ? <FormMessage message={message} tone="success" /> : null}

      {!isAdmin && !isOwner ? (
        <div className="app-card">
          <h2>Register as Owner</h2>
          <p>Register as an owner to add new business listings.</p>
          <div className="app-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => void registerAsOwner()}
            >
              Register as Owner
            </button>
          </div>
        </div>
      ) : null}

      <div className="app-card">
        <h2>Select Business</h2>
        <p>Search and select a business to manage.</p>
        <div className="app-actions">
          <input
            className="form-input"
            style={{ maxWidth: 440 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, area, city..."
          />
          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={selectedCity?.id || ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const city = cities.find((c) => c.id === id) || null;
              setSelectedCity(city);
            }}
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={selectedArea?.id || ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const area = areas.find((a) => a.id === id) || null;
              setSelectedArea(area);
            }}
          >
            <option value="">All Areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={selectedCategory?.id || ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const category = categories.find((c) => c.id === id) || null;
              setSelectedCategory(category);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => void searchBusinesses()}
          >
            Search
          </button>
        </div>
        {searchItems.length > 0 ? (
          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #d9e2ec",
                    padding: "8px 4px",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #d9e2ec",
                    padding: "8px 4px",
                  }}
                >
                  Business Ref
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #d9e2ec",
                    padding: "8px 4px",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {searchItems.map((item) => (
                <tr key={item.businessToken}>
                  <td
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      padding: "8px 4px",
                    }}
                  >
                    {item.name}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      padding: "8px 4px",
                    }}
                  >
                    {item.businessToken}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      padding: "8px 4px",
                    }}
                  >
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
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => void createBusiness()}
            >
              Create Business
            </button>
          </div>
        </div>
      ) : null}

      <div className="app-card">
        <h2>Edit Business</h2>
        <p>
          <strong>Plan:</strong> {planName}{" "}
          {isAdmin ? "(Admin/SuperAdmin can edit all selected businesses)" : ""}
        </p>
        <form onSubmit={saveBusiness}>
          <div className="app-grid">
            <div className="form-row">
              <label>Name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Name Hindi</label>
              <input
                className="form-input"
                value={nameHindi}
                onChange={(e) => setNameHindi(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Address</label>
              <input
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Phone</label>
              <input
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Website</label>
              <input
                className="form-input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Website Link</label>
              <input
                className="form-input"
                value={websiteLink}
                onChange={(e) => setWebsiteLink(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Menu Link</label>
              <input
                className="form-input"
                value={menuLink}
                onChange={(e) => setMenuLink(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Description</label>
              <input
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Avg Rating</label>
              <input
                className="form-input"
                value={avgRating}
                onChange={(e) => setAvgRating(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Total Reviews</label>
              <input
                className="form-input"
                value={totalReviews}
                onChange={(e) => setTotalReviews(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Place URL</label>
              <input
                className="form-input"
                value={placeUrl}
                onChange={(e) => setPlaceUrl(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Latitude</label>
              <input
                className="form-input"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Longitude</label>
              <input
                className="form-input"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Areas</label>
              <div
                className="app-grid"
                style={{ gridTemplateColumns: "2fr auto" }}
              >
                <input
                  className="form-input"
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  placeholder="Search areas by name"
                />
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => void searchAreas()}
                >
                  Search
                </button>
              </div>
              <div className="app-actions" style={{ flexWrap: "wrap" }}>
                {selectedAreas.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setSelectedAreas((prev) =>
                        prev.filter((x) => x.id !== area.id),
                      )
                    }
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
                      onClick={() =>
                        setSelectedAreas((prev) =>
                          prev.some((x) => x.id === area.id)
                            ? prev
                            : [...prev, area],
                        )
                      }
                    >
                      {area.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="form-row">
              <label>Categories</label>
              <div
                className="app-grid"
                style={{ gridTemplateColumns: "2fr auto" }}
              >
                <input
                  className="form-input"
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder="Search categories by name"
                />
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => void searchCategories()}
                >
                  Search
                </button>
              </div>
              <div className="app-actions" style={{ flexWrap: "wrap" }}>
                {selectedCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setSelectedCategories((prev) =>
                        prev.filter((x) => x.id !== cat.id),
                      )
                    }
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
                      onClick={() =>
                        setSelectedCategories((prev) =>
                          prev.some((x) => x.id === cat.id)
                            ? prev
                            : [...prev, cat],
                        )
                      }
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
              />{" "}
              Verified
            </label>
          </div>

          <div className="form-row">
            <label>JSON Data</label>
            <div
              style={{
                border: "1px solid #d9e2ec",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div className="app-actions" style={{ marginBottom: 12 }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`btn ${activeTab === tab.key ? "btn-primary" : "btn-ghost"}`}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    disabled={tab.disabled}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {(() => {
                const tab = tabs.find((t) => t.key === activeTab);
                if (!tab) return null;
                let parsed;
                try {
                  parsed = JSON.parse(
                    tab.value || (tab.rootType === "array" ? "[]" : "{}"),
                  );
                } catch {
                  return (
                    <FormMessage message="Invalid JSON data." tone="error" />
                  );
                }
                return (
                  <>
                    <JsonEditor
                      data={parsed}
                      onUpdate={(data) =>
                        tab.onChange(JSON.stringify(data, null, 2))
                      }
                    />
                    {tab.helperText && (
                      <p className="app-muted">{tab.helperText}</p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="app-actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!selected?.businessToken}
            >
              {isAdmin ? "Save in Scraped Tables" : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>

      <div className="app-card">
        <h2>Business Analytics</h2>
        <div className="app-actions">
          <select
            className="form-select"
            style={{ maxWidth: 180 }}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={!selected?.businessToken}
            onClick={() =>
              selected?.businessToken &&
              void loadAnalytics(selected.businessToken, days)
            }
          >
            Refresh
          </button>
        </div>
        {!analytics ? (
          <p>No analytics available.</p>
        ) : (
          <ul>
            {analytics.totalsByType.map((x) => (
              <li key={x.eventType}>
                {x.eventType}: {x.total}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
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
