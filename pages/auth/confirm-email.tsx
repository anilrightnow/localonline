import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import { getApiErrorMessage } from "../../lib/apiError";
import SiteShell from "../../components/public/SiteShell";
import { apiUrl } from "../../lib/apiClient";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const emailFromQuery = useMemo(() => (typeof router.query.email === "string" ? router.query.email : ""), [router.query.email]);
  const tokenFromQuery = useMemo(() => (typeof router.query.token === "string" ? router.query.token : ""), [router.query.token]);
  const [email, setEmail] = useState(emailFromQuery);
  const [token, setToken] = useState(tokenFromQuery);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
    if (tokenFromQuery) setToken(tokenFromQuery);
  }, [emailFromQuery, tokenFromQuery]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const response = await axios.post(apiUrl("/api/auth/confirm-email"), { email, token });
      setMessage(response.data?.message ?? "Email confirmed.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Email confirmation failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <div className="app-card" style={{ maxWidth: 520, margin: "24px auto" }}>
        <h2>Confirm Email</h2>
        {message ? <div className="msg msg-success">{message}</div> : null}
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Confirmation Token</label>
            <input className="form-input" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Confirming..." : "Confirm Email"}
          </button>
        </form>
        <div className="auth-links">
          <Link className="btn btn-ghost" href="/auth/login">
            Back to login
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
