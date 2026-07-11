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
import { AlertCircle, CheckCircle2, ExternalLink, Mail } from "lucide-react";
import { JsonEditor } from "json-edit-react";
import BusinessImageUploader, {
  type MediaItem,
} from "../../components/shared/BusinessImageUploader";

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
  imageLimit?: number | null;
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

  // Email verification
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Edit Form State
  const [editingBusiness, setEditingBusiness] =
    useState<ClaimedBusiness | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [planName, setPlanName] = useState("Free");
  const [imageLimit, setImageLimit] = useState(2);
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  // Update request tracking
  const [updateRequests, setUpdateRequests] = useState<any[]>([]);
  const [updateRequestLogs, setUpdateRequestLogs] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

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

  // Track whether the owner actually edited a tab, and whether the tab had
  // real data when the business was loaded. Used so that helpful scaffolds are
  // never persisted until the owner really changes something in that tab.
  const [aboutTouched, setAboutTouched] = useState(false);
  const [businessHoursTouched, setBusinessHoursTouched] = useState(false);
  const [menuTouched, setMenuTouched] = useState(false);
  const [aboutHadData, setAboutHadData] = useState(false);
  const [businessHoursHadData, setBusinessHoursHadData] = useState(false);
  const [menuHadData, setMenuHadData] = useState(false);
  const [canonicalPath, setCanonicalPath] = useState("");
  const [fullJson, setFullJson] = useState("{}");
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [galleryMedia, setGalleryMedia] = useState<MediaItem[]>([]);

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
      setImageLimit(b.imageLimit || 2);
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

      setAboutTouched(false);
      setBusinessHoursTouched(false);
      setMenuTouched(false);
      setAboutHadData(isJsonContent(b.aboutJson));
      setBusinessHoursHadData(isJsonContent(b.businessHoursJson));
      setMenuHadData(isJsonContent(b.menuJson));

      if (Array.isArray(b.mediaJson)) {
        setGalleryMedia(
          b.mediaJson.map((item: any) => ({
            PublicId: item.publicId || item.PublicId,
            LargeUrl: item.LargeUrl || "",
            ThumbUrl: item.ThumbUrl || item.LargeUrl || "",
          })),
        );
      } else if (typeof b.mediaJson === "string") {
        try {
          const parsed = JSON.parse(b.mediaJson);
          if (Array.isArray(parsed)) {
            setGalleryMedia(
              parsed.map((item: any) => ({
                PublicId: item.publicId || item.PublicId,
                LargeUrl: item.LargeUrl || "",
                ThumbUrl: item.ThumbUrl || item.LargeUrl || "",
              })),
            );
          } else {
            setGalleryMedia([]);
          }
        } catch {
          setGalleryMedia([]);
        }
      } else {
        setGalleryMedia([]);
      }

      setIsVerified(Boolean(b.isVerified));
      setActiveTab("about");
      setMessage("Business loaded successfully.");
      void loadAnalytics(businessToken, days);
      void loadUpdateRequests(businessToken);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to load business."));
    }
  }

  async function loadUpdateRequests(businessToken: string) {
    setLoadingRequests(true);
    try {
      const token = getAuthToken();
      const response = await axios.get<{ requests: any[]; logs: any[] }>(
        apiUrl(
          `/api/owner-listings/update-requests?businessToken=${encodeURIComponent(
            businessToken,
          )}`,
        ),
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setUpdateRequests(response.data?.requests ?? []);
      setUpdateRequestLogs(response.data?.logs ?? []);
    } catch (error) {
      console.error("Failed to load update requests:", error);
      setUpdateRequests([]);
      setUpdateRequestLogs([]);
    } finally {
      setLoadingRequests(false);
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
          // Only send a tab's data if the owner actually edited it, or it
          // already had real content. This keeps helpful scaffolds from being
          // persisted until the owner really changes something.
          aboutJson:
            aboutTouched || aboutHadData ? parseJsonOrNull(aboutJson) : undefined,
          businessHoursJson:
            businessHoursTouched || businessHoursHadData
              ? parseJsonOrNull(businessHoursJson)
              : undefined,
          reviewJson: parseJsonOrNull(reviewJson),
          mediaJson: galleryMedia.length
            ? galleryMedia
            : parseJsonOrNull(mediaJson),
          menuJson:
            menuTouched || menuHadData ? parseJsonOrNull(menuJson) : undefined,
          fullJson: parseJsonOrNull(fullJson),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setMessage(
        response.data?.message ?? "Update submitted for admin review.",
      );
      setShowEditForm(false);
      setEditingBusiness(null);
      setGalleryMedia([]);
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

  const canEditGallery =
    isAdmin || isOwner || planName.toLowerCase() === "popular";

  // Returns true if the JSON string holds meaningful (non-empty) content.
  function isJsonContent(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    const raw = typeof value === "string" ? (value as string).trim() : value;
    if (!raw) return false;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed.length > 0;
      if (parsed && typeof parsed === "object")
        return Object.keys(parsed).length > 0;
      return false;
    } catch {
      return false;
    }
  }

  // Build a friendly starting scaffold from the business's existing data so an
  // empty tab is easy to understand and fill in. The scaffold is only shown in
  // the editor; it is never persisted unless the owner edits that tab.
  function buildScaffold(tabKey: string): unknown {
    if (tabKey === "about") {
      const rows: Array<{ Key: string; Value: string[] }> = [
        {
          Key: "Overview",
          Value: [
            description?.trim() ||
              `Write a short introduction about ${
                name || "your business"
              }.`,
          ],
        },
      ];
      if (address?.trim())
        rows.push({ Key: "Address", Value: [address.trim()] });
      if (phone?.trim()) rows.push({ Key: "Phone", Value: [phone.trim()] });
      if (website?.trim())
        rows.push({ Key: "Website", Value: [website.trim()] });
      rows.push({
        Key: "Specialties",
        Value: ["Add your main services or products here."],
      });
      return rows;
    }

    if (tabKey === "businessHours") {
      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const weekend = ["Saturday", "Sunday"];
      return [
        {
          Category: "Monday to Friday",
          Hours: weekdays.map((day) => ({
            Day: day,
            Time: "9:00 AM - 9:00 PM",
          })),
        },
        {
          Category: "Saturday & Sunday",
          Hours: weekend.map((day) => ({
            Day: day,
            Time: "10:00 AM - 8:00 PM",
          })),
        },
      ];
    }

    if (tabKey === "menu") {
      return [
        {
          Category: "Popular",
          Items: [
            {
              Name: "Signature Dish",
              Price: 199,
              Description: "Describe your most popular item.",
            },
          ],
        },
      ];
    }

    return null;
  }

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
    (async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const response = await axios.get(apiUrl("/api/user/profile"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) {
          setEmailConfirmed(Boolean(response.data.emailConfirmed));
        }
      } catch {
        setEmailConfirmed(null);
      }
    })();
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

  async function handleResendVerification() {
    setResendingVerification(true);
    setResendMessage(null);
    try {
      const token = getAuthToken();
      const email = session.email;
      if (!token || !email) return;
      const response = await axios.post(apiUrl("/api/auth/resend-verification"), { email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResendMessage("Verification email sent. Please check your inbox.");
    } catch (err) {
      setResendMessage(getApiErrorMessage(err, "Could not resend verification email."));
    } finally {
      setResendingVerification(false);
    }
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

      {emailConfirmed === false && (
        <div className="app-card owner-verify-banner">
          <Mail size={20} />
          <div>
            <p className="owner-verify-title">Verify your email address</p>
            <p className="owner-verify-sub">
              Please confirm your email to unlock all features. Check your inbox for the verification link.
            </p>
            {resendMessage && (
              <p className={`app-note ${resendMessage.toLowerCase().includes("sent") ? "is-info" : "is-warn"}`}>
                {resendMessage}
              </p>
            )}
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleResendVerification}
            disabled={resendingVerification}
          >
            {resendingVerification ? "Sending..." : "Resend email"}
          </button>
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

              <div className="form-row" style={{ width: "100%", gridColumn: "1 / -1" }}>
                <label>Business Images</label>
                <BusinessImageUploader
                  businessToken={editingBusiness.businessToken}
                  planName={planName}
                  imageLimit={imageLimit || 2}
                  canEdit={canEditGallery}
                  isAdmin={isAdmin}
                  initialMedia={galleryMedia}
                  onMediaChange={setGalleryMedia}
                />
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
                        if (
                          tab.rootType === "array" &&
                          !Array.isArray(parsed)
                        ) {
                          parsed = [];
                        } else if (
                          tab.rootType === "object" &&
                          (Array.isArray(parsed) || !parsed)
                        ) {
                          parsed = {};
                        }

                        // Show a friendly scaffold for empty tabs so the owner
                        // has an easy starting point. The scaffold is only
                        // displayed; it is not written back unless edited.
                        const tabHasContent = tab.rootType === "array"
                          ? Array.isArray(parsed) && parsed.length > 0
                          : parsed && typeof parsed === "object" &&
                            Object.keys(parsed).length > 0;
                        if (!tabHasContent) {
                          const scaffold = buildScaffold(tab.key);
                          if (scaffold !== null) parsed = scaffold;
                        }
                      } catch (e) {
                        console.error("JSON parse error:", e);
                        return (
                          <div className="form-alert is-error">
                            <AlertCircle size={18} />
                            <span>
                              Invalid JSON format in {tab.label} data.
                            </span>
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
                              tab.onChange(JSON.stringify(data, null, 2));
                              if (tab.key === "about") setAboutTouched(true);
                              else if (tab.key === "businessHours")
                                setBusinessHoursTouched(true);
                              else if (tab.key === "menu") setMenuTouched(true);
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
            <h3>Your Update Requests</h3>
            <p className="app-muted" style={{ marginBottom: "12px" }}>
              Track the status of changes you've submitted for admin review.
            </p>
            {loadingRequests ? (
              <p>Loading requests...</p>
            ) : updateRequests.length === 0 ? (
              <p className="app-muted">No update requests submitted yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {updateRequests.map((req: any) => {
                  const reqLogs = updateRequestLogs.filter(
                    (l: any) => l.RequestId === req.Id,
                  );
                  return (
                    <div
                      key={req.Id}
                      style={{
                        border: "1px solid #d9e2ec",
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <strong>{req.BusinessName || "Business"}</strong>
                          <span
                            className="app-muted"
                            style={{ marginLeft: 8, fontSize: "0.85em" }}
                          >
                            {new Date(req.CreatedAt).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.8em",
                            padding: "4px 10px",
                            borderRadius: 12,
                            backgroundColor:
                              req.Status === "Approved"
                                ? "#dcf8c6"
                                : req.Status === "Rejected"
                                  ? "#f8d7da"
                                  : "#fff3cd",
                            color:
                              req.Status === "Approved"
                                ? "#155724"
                                : req.Status === "Rejected"
                                  ? "#721c24"
                                  : "#856404",
                          }}
                        >
                          {req.Status}
                        </span>
                      </div>
                      {req.Status === "Rejected" && req.RejectionReason && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "#721c24",
                            fontSize: "0.9em",
                          }}
                        >
                          Reason: {req.RejectionReason}
                        </p>
                      )}
                      {reqLogs.length > 0 && (
                        <ul
                          style={{
                            margin: "10px 0 0",
                            paddingLeft: 18,
                            fontSize: "0.85em",
                            color: "#555",
                          }}
                        >
                          {reqLogs.map((log: any) => (
                            <li key={log.Id}>
                              <strong>{log.Action}</strong>
                              {log.Note ? `: ${log.Note}` : ""}
                              <span className="app-muted">
                                {" "}
                                ({new Date(log.CreatedAt).toLocaleString("en-IN")})
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
