import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import { getApiErrorMessage } from "../../lib/apiError";
import SiteShell from "../../components/public/SiteShell";
import { apiUrl } from "../../lib/apiClient";
import FormField from "../../components/shared/FormField";
import FormMessage from "../../components/shared/FormMessage";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const emailFromQuery = useMemo(() => (typeof router.query.email === "string" ? router.query.email : ""), [router.query.email]);
  const tokenFromQuery = useMemo(() => (typeof router.query.token === "string" ? router.query.token : ""), [router.query.token]);
  const [email, setEmail] = useState(emailFromQuery);
  const [token, setToken] = useState(tokenFromQuery);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
    if (tokenFromQuery) setToken(tokenFromQuery);
  }, [emailFromQuery, tokenFromQuery]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setMessageType("");
    setLoading(true);
    try {
      const response = await axios.post(apiUrl("/api/auth/confirm-email"), { email, token });
      setMessage(response.data?.message ?? "Email confirmed.");
      setMessageType("success");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Email confirmation failed."));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Confirm your email</h2>
          <p className="auth-subtitle">Enter the verification token sent to your inbox.</p>
        </div>
        <FormMessage message={message} tone={messageType === "error" ? "error" : "success"} />
        <form onSubmit={onSubmit} className="auth-form">
          <FormField id="confirm-email" label="Email">
            <input
              className="form-input"
              id="confirm-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField id="confirm-token" label="Confirmation Token" helpText="Paste the exact code from your confirmation email.">
            <input
              className="form-input"
              id="confirm-token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </FormField>
          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Confirming..." : "Confirm Email"}
            </button>
          </div>
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
