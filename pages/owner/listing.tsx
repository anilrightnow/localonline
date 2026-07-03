import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { JsonEditor } from "json-edit-react";

type ClaimedBusiness = {
  businessToken: string;
  name: string;
  nameHindi?: string;
  address?: string;
  claimStatus:
    | "PendingEmailVerification"
    | "PendingApproval"
    | "Approved"
    | "Rejected";
  updatedAt: string;
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
  const session = useMemo(() => getUserSessionFromToken(getAuthToken()), []);
  const isAdmin = hasRole(session, "Admin");
  const isOwner = session.roles.includes("Owner");

  // Grid & Listing
  const [claimedBusinesses, setClaimedBusinesses] = useState<ClaimedBusiness[]>(
    [],
  );
  const [statusFilter, setStatusFilter] = useState<
    ClaimedBusiness["claimStatus"] | "All"
  >("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit Form State
  const [editingBusiness, setEditingBusiness] =
    useState<ClaimedBusiness | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [planName, setPlanName] = useState("Free");
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  // Form Fields
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
  const [selectedAreas, setSelectedAreas] = useState<MasterOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<MasterOption[]>(
    [],
  );
  const [initialAreaIds, setInitialAreaIds] = useState<number[]>([]);
  const [initialCategoryIds, setInitialCategoryIds] = useState<number[]>([]);
  const [areaSelectValue, setAreaSelectValue] = useState("");
  const [categorySelectValue, setCategorySelectValue] = useState("");
  const [actionsJson, setActionsJson] = useState("{}");
  const [aboutJson, setAboutJson] = useState("[]");
  const [businessHoursJson, setBusinessHoursJson] = useState("[]");
  const [reviewJson, setReviewJson] = useState("{}");
  const [mediaJson, setMediaJson] = useState("[]");
  const [menuJson, setMenuJson] = useState("[]");
  const [canonicalPath, setCanonicalPath] = useState("");
  const [fullJson, setFullJson] = useState("{}");
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  // Master Data
  const [cities, setCities] = useState<MasterOption[]>([]);
  const [areas, setAreas] = useState<MasterOption[]>([]);
  const [categories, setCategories] = useState<MasterOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<MasterOption | null>(null);
  const [selectedArea, setSelectedArea] = useState<MasterOption | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MasterOption | null>(
    null,
  );

  async function loadClaimedBusinesses() {
    setLoading(true);
    setMessage("");
    try {
      const token = getAuthToken();
      const response = await axios.get<ClaimedBusiness[]>(
        apiUrl("/api/owner-listings/mine"),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setClaimedBusinesses(response.data ?? []);
      if ((response.data ?? []).length === 0) {
        setMessage("No claimed businesses found.");
      }
    } catch (error) {
      setMessage(
        getApiErrorMessage(error, "Failed to load claimed businesses."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMasterData() {
    //console.log("loadMasterData called");
    try {
      const token = getAuthToken();
      //console.log("Auth token:", token ? "present" : "missing");
      const [citiesRes, areasRes, categoriesRes] = await Promise.all([
        axios.get<MasterOption[]>(apiUrl("/api/master/cities"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        axios.get<MasterOption[]>(apiUrl("/api/master/areas?q="), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        axios.get<MasterOption[]>(apiUrl("/api/master/categories?q="), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      setCities(citiesRes.data ?? []);
      setAreas(areasRes.data ?? []);
      setCategories(categoriesRes.data ?? []);
    } catch (error) {
      console.error("Failed to load master data:", error);
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

      // Fetch canonical path for preview link
      try {
        const canonRes = await axios.get(
          apiUrl(
            `/api/public-search/business-token/${encodeURIComponent(businessToken)}/canonical`,
          ),
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        setCanonicalPath(canonRes.data?.canonicalPath || "");
      } catch (err) {
        console.error("Failed to fetch canonical path:", err);
        setCanonicalPath("");
      }

      // Pre-populate area/category IDs and load actual object values by id
      const selectedAreaIds = b.areaIds ?? [];
      const selectedCategoryIds = b.categoryIds ?? [];
      setInitialAreaIds(selectedAreaIds);
      setInitialCategoryIds(selectedCategoryIds);

      if (selectedAreaIds.length > 0) {
        try {
          const areaResp = await axios.get<MasterOption[]>(
            apiUrl(`/api/master/areas?ids=${selectedAreaIds.join(",")}`),
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
          );
          setSelectedAreas(areaResp.data ?? []);
        } catch (err) {
          console.error("Failed to load selected areas:", err);
          setSelectedAreas(areas.filter((a) => selectedAreaIds.includes(a.id)));
        }
      } else {
        setSelectedAreas([]);
      }

      if (selectedCategoryIds.length > 0) {
        try {
          const categoryResp = await axios.get<MasterOption[]>(
            apiUrl(
              `/api/master/categories?ids=${selectedCategoryIds.join(",")}`,
            ),
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
          );
          setSelectedCategories(categoryResp.data ?? []);
        } catch (err) {
          console.error("Failed to load selected categories:", err);
          setSelectedCategories(
            categories.filter((c) => selectedCategoryIds.includes(c.id)),
          );
        }
      } else {
        setSelectedCategories([]);
      }

      // Ensure we treat these as valid JSON strings for the editor
      const stringifySafe = (val: any, fallback: string) => {
        if (typeof val === "string") return val || fallback;
        return val ? JSON.stringify(val, null, 2) : fallback;
      };

      setActionsJson(stringifySafe(b.actionsJson, "{}"));
      setAboutJson(stringifySafe(b.aboutJson, "[]"));
      setBusinessHoursJson(stringifySafe(b.businessHoursJson, "[]"));
      setReviewJson(stringifySafe(b.reviewJson, "{}"));
      setMediaJson(stringifySafe(b.mediaJson, "[]"));
      setMenuJson(stringifySafe(b.menuJson, "[]"));
      setFullJson(stringifySafe(b.fullJson, "{}"));
      setIsVerified(Boolean(b.isVerified));
      setActiveTab("about");
      setMessage("Business loaded successfully.");
      void loadAnalytics(businessToken, days);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to load business."));
    }
  }

  async function saveBusiness(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!editingBusiness?.businessToken) {
      setMessage("No business selected.");
      return;
    }
    try {
      const token = getAuthToken();
      const response = await axios.put(
        apiUrl(
          `/api/owner-listings/businesses/${encodeURIComponent(
            editingBusiness.businessToken,
          )}`,
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
      setMessage(
        response.data?.message ?? "Update submitted for admin review.",
      );
      setShowEditForm(false);
      setEditingBusiness(null);
      void loadClaimedBusinesses();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Save failed."));
    }
  }

  function openEditForm(business: ClaimedBusiness) {
    setEditingBusiness(business);
    void loadBusiness(business.businessToken);
    setShowEditForm(true);
  }

  function closeEditForm() {
    setShowEditForm(false);
    setEditingBusiness(null);
  }

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
          `/api/owner-listings/businesses/${encodeURIComponent(
            businessToken,
          )}/analytics`,
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

  const canEditGallery = isAdmin || planName.toLowerCase() === "popular";

  // Generate full JSON from all form data
  const generateFullJson = () => {
    const fullData = {
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
      about: parseJsonOrNull(aboutJson),
      businessHours: parseJsonOrNull(businessHoursJson),
      media: parseJsonOrNull(mediaJson),
      menu: parseJsonOrNull(menuJson),
    };
    return fullData;
  };

  // Update fullJson whenever form changes
  useEffect(() => {
    if (showEditForm && editingBusiness) {
      setFullJson(JSON.stringify(generateFullJson(), null, 2));
    }
  }, [
    name,
    nameHindi,
    address,
    phone,
    website,
    websiteLink,
    menuLink,
    description,
    placeUrl,
    latitude,
    longitude,
    avgRating,
    totalReviews,
    selectedAreas,
    selectedCategories,
    isVerified,
    aboutJson,
    businessHoursJson,
    mediaJson,
    menuJson,
    showEditForm,
    editingBusiness,
  ]);

  type TabDefinition = {
    key: string;
    label: string;
    value: unknown;
    onChange: (value: string) => void;
    rootType: "array" | "object";
    disabled?: boolean;
    helperText?: string;
  };

  const tabs: TabDefinition[] = [
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
      rootType: "array" as const,
    },
    {
      key: "media",
      label: "Media",
      value: mediaJson,
      onChange: setMediaJson,
      rootType: "array" as const,
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
      rootType: "array" as const,
    },
  ];

  const filteredBusinesses =
    statusFilter === "All"
      ? claimedBusinesses
      : claimedBusinesses.filter((b) => b.claimStatus === statusFilter);

  const getStatusColor = (status: ClaimedBusiness["claimStatus"]) => {
    switch (status) {
      case "Approved":
        return "#dcf8c6";
      case "PendingApproval":
        return "#fff3cd";
      case "PendingEmailVerification":
        return "#fff3cd";
      case "Rejected":
        return "#f8d7da";
      default:
        return "#e9ecef";
    }
  };

  const getStatusTextColor = (status: ClaimedBusiness["claimStatus"]) => {
    switch (status) {
      case "Approved":
        return "#155724";
      case "PendingApproval":
        return "#856404";
      case "PendingEmailVerification":
        return "#856404";
      case "Rejected":
        return "#721c24";
      default:
        return "#383d41";
    }
  };

  useEffect(() => {
    void loadClaimedBusinesses();
    void loadMasterData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (initialAreaIds.length > 0 && areas.length > 0) {
      setSelectedAreas(areas.filter((a) => initialAreaIds.includes(a.id)));
    }
  }, [areas, initialAreaIds]);

  useEffect(() => {
    if (initialCategoryIds.length > 0 && categories.length > 0) {
      setSelectedCategories(
        categories.filter((c) => initialCategoryIds.includes(c.id)),
      );
    }
  }, [categories, initialCategoryIds]);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  return (
    <AppShell
      title="My Business Listings"
      subtitle="Manage your claimed businesses"
    >
      {message && (
        <div
          className={`form-alert ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("error") ? "is-error" : "is-success"}`}
        >
          {message.toLowerCase().includes("failed") ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{message}</span>
        </div>
      )}

      {!isAdmin && !isOwner ? (
        <div className="app-card">
          <h2>Register as Owner</h2>
          <p>Register as an owner to manage business listings.</p>
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

      {!showEditForm && (
        <div className="app-card">
          <h2>My Claimed Businesses</h2>
          <p>Select a status filter to view your claimed businesses.</p>

          <div className="app-actions" style={{ marginBottom: "16px" }}>
            <button
              className={`btn ${statusFilter === "All" ? "btn-primary" : "btn-ghost"}`}
              type="button"
              onClick={() => setStatusFilter("All")}
            >
              All ({claimedBusinesses.length})
            </button>
            <button
              className={`btn ${
                statusFilter === "Approved" ? "btn-primary" : "btn-ghost"
              }`}
              type="button"
              onClick={() => setStatusFilter("Approved")}
            >
              Approved (
              {
                claimedBusinesses.filter((b) => b.claimStatus === "Approved")
                  .length
              }
              )
            </button>
            <button
              className={`btn ${
                statusFilter === "PendingApproval" ? "btn-primary" : "btn-ghost"
              }`}
              type="button"
              onClick={() => setStatusFilter("PendingApproval")}
            >
              Pending Approval (
              {
                claimedBusinesses.filter(
                  (b) => b.claimStatus === "PendingApproval",
                ).length
              }
              )
            </button>
            <button
              className={`btn ${
                statusFilter === "PendingEmailVerification"
                  ? "btn-primary"
                  : "btn-ghost"
              }`}
              type="button"
              onClick={() => setStatusFilter("PendingEmailVerification")}
            >
              Email Verification (
              {
                claimedBusinesses.filter(
                  (b) => b.claimStatus === "PendingEmailVerification",
                ).length
              }
              )
            </button>
            <button
              className={`btn ${
                statusFilter === "Rejected" ? "btn-primary" : "btn-ghost"
              }`}
              type="button"
              onClick={() => setStatusFilter("Rejected")}
            >
              Rejected (
              {
                claimedBusinesses.filter((b) => b.claimStatus === "Rejected")
                  .length
              }
              )
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#8898aa" }}>
              Loading businesses...
            </p>
          ) : filteredBusinesses.length === 0 ? (
            <p style={{ textAlign: "center", color: "#8898aa" }}>
              No businesses found with the selected status.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              {filteredBusinesses.map((business) => (
                <div
                  key={business.businessToken}
                  style={{
                    border: "1px solid #d9e2ec",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: getStatusColor(business.claimStatus),
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
                    {business.name}
                  </h3>
                  {business.nameHindi && (
                    <p
                      style={{
                        margin: "4px 0",
                        fontSize: "0.9em",
                        color: "#555",
                      }}
                    >
                      {business.nameHindi}
                    </p>
                  )}
                  {business.address && (
                    <p
                      style={{
                        margin: "4px 0",
                        fontSize: "0.9em",
                        color: "#555",
                      }}
                    >
                      📍 {business.address}
                    </p>
                  )}
                  <p
                    style={{
                      margin: "12px 0 4px 0",
                      fontSize: "0.85em",
                      fontWeight: "bold",
                      color: getStatusTextColor(business.claimStatus),
                    }}
                  >
                    Status: {business.claimStatus}
                  </p>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "0.85em",
                      color: "#666",
                    }}
                  >
                    Updated:{" "}
                    {new Date(business.updatedAt).toLocaleDateString("en-IN")}
                  </p>

                  <div className="app-actions">
                    {business.claimStatus === "Approved" ? (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => openEditForm(business)}
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        className="btn btn-ghost"
                        type="button"
                        disabled
                        title="Only approved businesses can be edited"
                      >
                        Edit (Locked)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEditForm && editingBusiness && (
        <div className="app-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2>Edit Business: {editingBusiness.name}</h2>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={closeEditForm}
            >
              ← Back to List
            </button>
          </div>
          <p style={{ color: "#666", marginBottom: "16px" }}>
            <strong>Plan:</strong> {planName}
          </p>

          {!isAdmin && (
            <div className="form-alert is-warning">
              <AlertCircle size={18} />
              <span>
                Your updates will be submitted for admin review. Changes will be
                reflected on the live site once approved.
              </span>
            </div>
          )}

          <form onSubmit={saveBusiness}>
            <div className="app-grid">
              <div className="form-row">
                <label>Name *</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
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
                  type="number"
                  step="0.1"
                  value={avgRating}
                  onChange={(e) => setAvgRating(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Total Reviews</label>
                <input
                  className="form-input"
                  type="number"
                  value={totalReviews}
                  onChange={(e) => setTotalReviews(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Latitude</label>
                <input
                  className="form-input"
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Longitude</label>
                <input
                  className="form-input"
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label>Areas</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {selectedAreas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          border: "1px solid #d9e2ec",
                          backgroundColor: "#f8f9fa",
                          color: "#333",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setSelectedAreas((prev) =>
                            prev.filter((a) => a.id !== area.id),
                          )
                        }
                      >
                        {area.name} ×
                      </button>
                    ))}
                  </div>
                  <select
                    className="form-select"
                    value={areaSelectValue}
                    onChange={(e) => {
                      const areaId = Number(e.target.value);
                      const selectedArea = areas.find((a) => a.id === areaId);
                      if (
                        selectedArea &&
                        !selectedAreas.some((a) => a.id === areaId)
                      ) {
                        setSelectedAreas((prev) => [...prev, selectedArea]);
                      }
                      setAreaSelectValue("");
                    }}
                  >
                    <option value="">Select an area</option>
                    {areas
                      .filter((a) => !selectedAreas.some((s) => s.id === a.id))
                      .map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                  </select>
                  <p
                    style={{
                      fontSize: "0.85em",
                      color: "#666",
                      marginTop: "4px",
                    }}
                  >
                    Select an area from the dropdown. Selected values are
                    prefilled.
                  </p>
                </div>
              </div>

              <div className="form-row">
                <label>Categories</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {selectedCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          border: "1px solid #d9e2ec",
                          backgroundColor: "#f8f9fa",
                          color: "#333",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setSelectedCategories((prev) =>
                            prev.filter((c) => c.id !== cat.id),
                          )
                        }
                      >
                        {cat.name} ×
                      </button>
                    ))}
                  </div>
                  <select
                    className="form-select"
                    value={categorySelectValue}
                    onChange={(e) => {
                      const categoryId = Number(e.target.value);
                      const selectedCategory = categories.find(
                        (c) => c.id === categoryId,
                      );
                      if (
                        selectedCategory &&
                        !selectedCategories.some((c) => c.id === categoryId)
                      ) {
                        setSelectedCategories((prev) => [
                          ...prev,
                          selectedCategory,
                        ]);
                      }
                      setCategorySelectValue("");
                    }}
                  >
                    <option value="">Select a category</option>
                    {categories
                      .filter(
                        (c) => !selectedCategories.some((s) => s.id === c.id),
                      )
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  <p
                    style={{
                      fontSize: "0.85em",
                      color: "#666",
                      marginTop: "4px",
                    }}
                  >
                    Select a category from the dropdown. Selected values are
                    prefilled.
                  </p>
                </div>
              </div>
            </div>

            <div className="form-row">
              <label>
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                />
                Verified
              </label>
            </div>

            <div className="form-row" style={{ width: "100%" }}>
              <label>JSON Data</label>
              <div
                style={{
                  border: "1px solid #d9e2ec",
                  borderRadius: 10,
                  padding: 12,
                  width: "100%",
                  height: "600px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="app-actions" style={{ marginBottom: 12 }}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={`btn ${
                        activeTab === tab.key ? "btn-primary" : "btn-ghost"
                      }`}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      disabled={tab.disabled}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    flex: 1,
                    overflow: "auto",
                    minHeight: "400px",
                    maxHeight: "600px",
                    height: "100%",
                    border: "1px solid #e0e0e0",
                    borderRadius: "6px",
                    padding: "12px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  {(() => {
                    const tab = tabs.find((t) => t.key === activeTab);
                    if (!tab) return null;
                    let parsed;
                    try {
                      const rawValue = tab.value;
                      if (typeof rawValue === "string") {
                        const jsonStr =
                          rawValue.trim() ||
                          (tab.rootType === "array" ? "[]" : "{}");
                        parsed = JSON.parse(jsonStr);

                        // Handle double-encoded JSON strings
                        if (typeof parsed === "string" && parsed !== "null") {
                          parsed = JSON.parse(parsed);
                        }
                      } else if (rawValue && typeof rawValue === "object") {
                        parsed = rawValue;
                      } else {
                        parsed = tab.rootType === "array" ? [] : {};
                      }

                      // Fallback check to prevent JsonEditor from crashing on null/non-array data
                      if (tab.rootType === "array" && !Array.isArray(parsed)) {
                        parsed = [];
                      } else if (
                        tab.rootType === "object" &&
                        (Array.isArray(parsed) || !parsed)
                      ) {
                        parsed = {};
                      }
                    } catch (e) {
                      console.error("JSON parse error:", e);
                      return (
                        <div className="form-alert is-error">
                          <AlertCircle size={18} />
                          <span>Invalid JSON format in {tab.label} data.</span>
                        </div>
                      );
                    }
                    return (
                      <>
                        <JsonEditor
                          key={`json-editor-${activeTab}`}
                          className="full-width-json-editor"
                          minWidth="100%"
                          maxWidth="100%"
                          rootName={tab.key}
                          data={parsed}
                          onUpdate={(data) => {
                            console.log("JsonEditor updated:", {
                              tab: tab.key,
                              data,
                              stringified: JSON.stringify(data, null, 2),
                            });
                            tab.onChange(JSON.stringify(data, null, 2));
                          }}
                        />
                        {tab.helperText && (
                          <p className="app-muted">{tab.helperText}</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="app-actions">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!editingBusiness?.businessToken}
              >
                {isAdmin ? "Save Changes" : "Submit for Review"}
              </button>
              {canonicalPath && (
                <a
                  href={canonicalPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <ExternalLink size={16} /> View Live Profile
                </a>
              )}
              <button
                className="btn btn-ghost"
                type="button"
                onClick={closeEditForm}
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="app-card" style={{ marginTop: "24px" }}>
            <h3>Business Analytics</h3>
            <div className="app-actions" style={{ marginBottom: "12px" }}>
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
                onClick={() =>
                  editingBusiness &&
                  void loadAnalytics(editingBusiness.businessToken, days)
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
        </div>
      )}
    </AppShell>
  );
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
