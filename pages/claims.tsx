import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { getAuthToken, useRequireAuth } from "../lib/auth";
import { getApiErrorMessage } from "../lib/apiError";
import { apiUrl, apiFetch } from "../lib/apiClient";
import { getUserSessionFromToken } from "../lib/session";
import AppShell from "../components/app/AppShell";
import FormMessage from "../components/shared/FormMessage";
import { Mail } from "lucide-react";

type ClaimItem = {
  id: string;
  businessToken?: string | null;
  businessName?: string | null;
  status: string;
  contactEmail: string;
  documents?: Array<{ name: string; url: string; type?: string }>;
  createdAt: string;
};

type BusinessOption = {
  businessToken: string;
  name: string;
  address?: string | null;
};

export default function ClaimsPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const businessTokenFromQuery = useMemo(
    () =>
      typeof router.query.businessToken === "string"
        ? router.query.businessToken
        : "",
    [router.query.businessToken],
  );
  const verificationTokenFromQuery = useMemo(
    () => (typeof router.query.token === "string" ? router.query.token : ""),
    [router.query.token],
  );
  const [businessToken, setBusinessToken] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessQuery, setBusinessQuery] = useState("");
  const [businessOptions, setBusinessOptions] = useState<BusinessOption[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [documents, setDocuments] = useState<
    Array<{ name: string; url: string; type?: string }>
  >([]);
  const [message, setMessage] = useState("");
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

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

  useEffect(() => {
    setBusinessToken(businessTokenFromQuery || "");
    void loadBusinessName(businessTokenFromQuery || "");
  }, [businessTokenFromQuery]);

  useEffect(() => {
    if (verificationTokenFromQuery) {
      setVerificationToken(verificationTokenFromQuery);
    }
  }, [verificationTokenFromQuery]);

  async function loadMine() {
    try {
      const token = getAuthToken();
      const response = await axios.get(apiUrl("/api/listing-claims/mine"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setClaims(response.data ?? []);
    } catch {
      setClaims([]);
    }
  }

  async function submitClaim(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!businessToken) {
      setMessage("Please choose a business listing before submitting a claim.");
      return;
    }
    try {
      const token = getAuthToken();
      const response = await axios.post(
        apiUrl("/api/listing-claims/request"),
        { businessToken, contactEmail, documents },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setVerificationToken(response.data?.verificationToken ?? "");
      setMessage(response.data?.message ?? "Claim submitted.");
      setDocuments([]);
      setDocName("");
      setDocUrl("");
      await loadMine();
    } catch (error) {
      setMessage(
        getApiErrorMessage(
          error,
          "Claim request failed. Make sure you are logged in.",
        ),
      );
    }
  }

  async function verifyToken(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await axios.post(
        apiUrl("/api/listing-claims/verify-email"),
        { token: verificationToken },
      );
      setMessage(response.data?.message ?? "Verification successful.");
      await loadMine();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Verification failed."));
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void loadMine();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const response = await apiFetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const json = (await response.json()) as any;
          if (mounted) setEmailConfirmed(Boolean(json.emailConfirmed));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  async function handleResendVerification() {
    setResendingVerification(true);
    setResendMessage(null);
    try {
      const token = getAuthToken();
      const session = getUserSessionFromToken(token);
      const email = session?.email;
      if (!token || !email) return;
      const response = await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error(await response.text());
      setResendMessage("Verification email sent. Please check your inbox.");
    } catch (err) {
      setResendMessage(getApiErrorMessage(err, "Could not resend verification email."));
    } finally {
      setResendingVerification(false);
    }
  }

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  const showVerification =
    Boolean(verificationToken) ||
    claims.some((c) =>
      String(c.status || "")
        .toLowerCase()
        .includes("pendingemail"),
    );

  return (
    <AppShell
      title="Listing Claims"
      subtitle="Request ownership of business listings and verify by email token."
    >
      {message ? <FormMessage message={message} tone="success" /> : null}

      {emailConfirmed === false && (
        <div className="app-card claims-verify-banner">
          <Mail size={20} />
          <div>
            <p className="claims-verify-title">Verify your email address</p>
            <p className="claims-verify-sub">
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

      <div className="app-grid">
        <div className="app-card">
          <h2>Request Claim</h2>
          <form onSubmit={submitClaim}>
            <div className="form-row">
              <label>Business</label>
              <div
                className="app-grid"
                style={{ gridTemplateColumns: "2fr auto" }}
              >
                <input
                  className="form-input"
                  value={businessQuery}
                  onChange={(e) => setBusinessQuery(e.target.value)}
                  placeholder="Search business by name"
                />
                <button
                  // Removed inline style and added class for styling
                  // style={{ marginRight: 8, marginBottom: 8 }}
                  className="btn btn-ghost business-search-btn"
                  type="button"
                  onClick={() => void searchBusinesses()}
                >
                  Search
                </button>
              </div>
              {businessOptions.length ? (
                <div className="app-card" style={{ marginTop: 8 }}>
                  {businessOptions.map((b) => (
                    <button
                      key={b.businessToken}
                      type="button"
                      // Removed inline style and added class for styling
                      // style={{ marginRight: 8, marginBottom: 8 }}
                      className="btn btn-ghost business-option-btn"
                      onClick={() => {
                        setBusinessToken(b.businessToken);
                        setBusinessName(b.name);
                        setBusinessOptions([]);
                      }}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              ) : null}
              <div
                // Removed inline style and added class for styling
                // style={{ background: "#f8fafc" }}
                className="form-input business-name-display"
              >
                {businessLoading
                  ? "Loading business..."
                  : businessName || "Select a business from search."}
              </div>
              <input type="hidden" value={businessToken} />
            </div>
            <div className="form-row">
              <label htmlFor="contact-email">Contact Email</label>
              <input
                className="form-input"
                id="contact-email"
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Ownership Document Name</label>
              <input
                className="form-input"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="GST, utility bill, registration certificate..."
              />
            </div>
            <div className="form-row">
              <label>Ownership Document URL</label>
              <input
                className="form-input"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="app-actions" style={{ marginBottom: 10 }}>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  if (!docName.trim() || !docUrl.trim()) {
                    setMessage(
                      "Document name and URL are required to add a document.",
                    );
                    return;
                  }
                  setDocuments((prev) => [
                    ...prev,
                    { name: docName.trim(), url: docUrl.trim() },
                  ]);
                  setDocName("");
                  setDocUrl("");
                }}
              >
                Add Document
              </button>
            </div>
            {documents.length > 0 ? (
              <ul>
                {documents.map((doc, idx) => (
                  <li key={`${doc.url}-${idx}`}>
                    {doc.name}{" "}
                    <a href={doc.url} target="_blank" rel="noreferrer">
                      view
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <button
              className="btn btn-primary submit-claim-btn"
              type="submit"
              disabled={!businessToken}
            >
              Request Claim
            </button>
          </form>
        </div>

        {showVerification ? (
          <div className="app-card">
            <h2>Verify Email Token</h2>
            <form onSubmit={verifyToken}>
              <div className="form-row">
                <label htmlFor="verify-token">Verification Token</label>
                <input
                  className="form-input"
                  id="verify-token"
                  required
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                />
              </div>
              <button className="btn btn-ghost" type="submit">
                Verify Email
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div className="app-card">
        <h2>My Claims</h2>
        {claims.length === 0 ? <p>No claims yet.</p> : null}
        <ul>
          {claims.map((claim) => (
            <li key={claim.id}>
              {claim.businessName || claim.businessToken || "N/A"} -{" "}
              {claim.status} - {new Date(claim.createdAt).toLocaleString()}
              {claim.documents?.length
                ? ` - docs: ${claim.documents.length}`
                : ""}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
