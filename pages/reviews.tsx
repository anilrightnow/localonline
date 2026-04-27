import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useRequireAuth } from "../lib/auth";
import { getApiErrorMessage } from "../lib/apiError";
import { getAuthToken } from "../lib/auth";
import { apiUrl } from "../lib/apiClient";
import AppShell from "../components/app/AppShell";
import FormMessage from "../components/shared/FormMessage";

type PublicReview = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
};

type MyReview = {
  id: string;
  businessToken?: string | null;
  businessName?: string | null;
  rating: number;
  title: string;
  comment: string;
  status: string;
  updatedAt: string;
  createdAt: string;
};

type MyReviewResponse = {
  items: MyReview[];
  page: number;
  pageSize: number;
  total: number;
};

type BusinessOption = {
  businessToken: string;
  name: string;
  address?: string | null;
};

export default function ReviewsPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const businessTokenFromQuery = useMemo(
    () =>
      typeof router.query.businessToken === "string"
        ? router.query.businessToken
        : "",
    [router.query.businessToken],
  );

  const [businessToken, setBusinessToken] = useState(businessTokenFromQuery);
  const [businessName, setBusinessName] = useState("");
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessQuery, setBusinessQuery] = useState("");
  const [businessOptions, setBusinessOptions] = useState<BusinessOption[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("updated_desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  async function loadBusinessName(token: string) {
    if (!token) {
      setBusinessName("");
      return;
    }
    setBusinessLoading(true);
    try {
      const authToken = getAuthToken();
      const response = await axios.get(
        apiUrl(
          `/api/public-search/business-token/${encodeURIComponent(token)}`,
        ),
        {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        },
      );
      setBusinessName(response.data?.detail?.name ?? "");
    } catch {
      setBusinessName("");
    } finally {
      setBusinessLoading(false);
    }
  }

  async function searchBusinesses() {
    try {
      const token = getAuthToken();
      const response = await axios.get<BusinessOption[]>(
        apiUrl("/api/owner-listings/search"),
        {
          params: { q: businessQuery, limit: 20 },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setBusinessOptions(response.data ?? []);
    } catch {
      setBusinessOptions([]);
    }
  }

  async function loadMyReviews(nextPage = page) {
    try {
      const token = getAuthToken();
      const response = await axios.get<MyReviewResponse>(
        apiUrl("/api/reviews/mine"),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: {
            status: statusFilter === "all" ? undefined : statusFilter,
            sort,
            page: nextPage,
            pageSize,
          },
        },
      );
      setMyReviews(response.data.items ?? []);
      setTotal(response.data.total ?? 0);
      setPage(response.data.page ?? nextPage);
    } catch {
      setMyReviews([]);
      setTotal(0);
    }
  }

  async function loadReviews(targetBusinessToken: string) {
    if (!targetBusinessToken) return;
    try {
      const response = await axios.get(
        apiUrl(
          `/api/reviews/business-token/${encodeURIComponent(targetBusinessToken)}`,
        ),
      );
      setReviews(response.data ?? []);
    } catch {
      setReviews([]);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!businessToken) {
      setMessage(
        "Please open a business detail page before submitting a review.",
      );
      return;
    }
    try {
      const token = getAuthToken();
      const response = await axios.post(
        apiUrl(
          `/api/reviews/business-token/${encodeURIComponent(businessToken)}`,
        ),
        { rating, title, comment },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setMessage(response.data?.message ?? "Review submitted.");
      await loadMyReviews(1);
      await loadReviews(businessToken);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Review submission failed."));
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadMyReviews(1);
  }, [isAuthenticated, statusFilter, sort, pageSize]);

  useEffect(() => {
    setBusinessToken(businessTokenFromQuery || "");
    void loadBusinessName(businessTokenFromQuery || "");
    if (businessTokenFromQuery) {
      void loadReviews(businessTokenFromQuery);
    }
  }, [businessTokenFromQuery]);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AppShell
      title="Reviews"
      subtitle="Submit reviews and manage your moderation status with filters and paging."
    >
      {message ? <FormMessage message={message} tone="success" /> : null}

      <div className="app-card">
        <h2>My Reviews</h2>
        <div className="app-grid">
          <div className="form-row">
            <label>Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="form-row">
            <label>Sort</label>
            <select
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="updated_desc">Updated (Newest)</option>
              <option value="updated_asc">Updated (Oldest)</option>
              <option value="rating_desc">Rating (High-Low)</option>
              <option value="rating_asc">Rating (Low-High)</option>
              <option value="created_desc">Created (Newest)</option>
              <option value="created_asc">Created (Oldest)</option>
            </select>
          </div>
          <div className="form-row">
            <label>Page Size</label>
            <select
              className="form-select"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {myReviews.length === 0 ? <p>No reviews found.</p> : null}
        {myReviews.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #d9e2ec",
                    padding: "8px 4px",
                  }}
                >
                  Business
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #d9e2ec",
                    padding: "8px 4px",
                  }}
                >
                  Rating
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #d9e2ec",
                    padding: "8px 4px",
                  }}
                >
                  Title
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #d9e2ec",
                    padding: "8px 4px",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #d9e2ec",
                    padding: "8px 4px",
                  }}
                >
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {myReviews.map((item) => (
                <tr key={item.id}>
                  <td
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      padding: "8px 4px",
                    }}
                  >
                    {item.businessName || item.businessToken || "-"}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      padding: "8px 4px",
                    }}
                  >
                    {item.rating}/5
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      padding: "8px 4px",
                    }}
                  >
                    {item.title || "-"}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      padding: "8px 4px",
                    }}
                  >
                    {item.status}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      padding: "8px 4px",
                    }}
                  >
                    {new Date(item.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <div className="app-actions" style={{ marginTop: 12 }}>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={page <= 1}
            onClick={() => void loadMyReviews(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={page >= totalPages}
            onClick={() => void loadMyReviews(page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <div className="app-card">
        <h2>Approved Reviews</h2>
        {reviews.length === 0 ? <p>No approved reviews yet.</p> : null}
        <ul>
          {reviews.map((review) => (
            <li key={review.id} style={{ marginBottom: 8 }}>
              <strong>{review.rating}/5</strong> {review.title}
              <div>{review.comment}</div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
