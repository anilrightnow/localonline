import { useState } from "react";
import axios from "axios";
import AppShell from "../../components/app/AppShell";
import { getAuthToken } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";

type PendingClaim = { id: string; businessToken?: string | null; claimedByUserId: string; contactEmail: string; createdAt: string };
type PendingReview = { id: string; businessToken?: string | null; rating: number; title: string; comment: string; createdAt: string };

export default function ModerationPage() {
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [message, setMessage] = useState("");

  async function loadPending() {
    setMessage("");
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [claimsRes, reviewsRes] = await Promise.all([
        axios.get(apiUrl("/api/listing-claims/pending"), { headers }),
        axios.get(apiUrl("/api/reviews/pending"), { headers }),
      ]);
      setClaims(claimsRes.data ?? []);
      setReviews(reviewsRes.data ?? []);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to load pending queue."));
    }
  }

  async function moderateClaim(id: string, action: "approve" | "reject") {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await axios.post(
      apiUrl(`/api/listing-claims/${id}/${action}`),
      action === "reject" ? { reason: "Rejected by admin." } : {},
      { headers },
    );
    await loadPending();
  }

  async function moderateReview(id: string, action: "approve" | "reject") {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await axios.post(
      apiUrl(`/api/reviews/${id}/${action}`),
      action === "reject" ? { reason: "Rejected by admin." } : {},
      { headers },
    );
    await loadPending();
  }

  return (
    <AppShell requiredRole="Admin" title="Moderation Queue" subtitle="Review pending claims and reviews.">
      <div className="app-actions">
        <button className="btn btn-primary" onClick={loadPending}>Load Pending</button>
      </div>
      {message ? <div className="msg msg-error">{message}</div> : null}

      <div className="app-card">
        <h2>Pending Claims</h2>
        {claims.length === 0 ? <p>No pending claims.</p> : null}
        <ul>
          {claims.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              {item.businessToken ?? "N/A"} ({item.contactEmail})
              <button className="btn btn-primary" style={{ marginLeft: 10 }} onClick={() => moderateClaim(item.id, "approve")}>Approve</button>
              <button className="btn btn-ghost" style={{ marginLeft: 6 }} onClick={() => moderateClaim(item.id, "reject")}>Reject</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="app-card">
        <h2>Pending Reviews</h2>
        {reviews.length === 0 ? <p>No pending reviews.</p> : null}
        <ul>
          {reviews.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              {item.businessToken ?? "N/A"}: {item.rating}/5 {item.title}
              <button className="btn btn-primary" style={{ marginLeft: 10 }} onClick={() => moderateReview(item.id, "approve")}>Approve</button>
              <button className="btn btn-ghost" style={{ marginLeft: 6 }} onClick={() => moderateReview(item.id, "reject")}>Reject</button>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
