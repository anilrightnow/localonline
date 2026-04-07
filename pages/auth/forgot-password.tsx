import { FormEvent, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import SiteShell from "../../components/public/SiteShell";
import FormField from "../../components/shared/FormField";
import FormMessage from "../../components/shared/FormMessage";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setMessageType("");
    try {
      const response = await axios.post(apiUrl("/api/auth/forgot-password"), { email });
      setMessage(response.data?.message ?? "Reset instructions sent. Check your email.");
      setMessageType("success");
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Unable to process request."));
      setMessageType("error");
    }
  }

  return (
    <SiteShell>
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Forgot your password?</h1>
          <p className="auth-subtitle">We will send reset instructions to your email.</p>
        </div>
        <FormMessage message={message} tone={messageType === "error" ? "error" : "success"} />
        <form onSubmit={onSubmit} className="auth-form">
          <FormField id="forgot-email" label="Email" helpText="Use the email linked to your LocalOnline account.">
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </FormField>
          <div className="auth-actions">
            <button className="btn btn-primary" type="submit">
              Send reset email
            </button>
          </div>
        </form>
        <div className="auth-links">
          <Link className="btn btn-ghost" href="/auth/reset-password">
            Reset password
          </Link>
          <Link className="btn btn-ghost" href="/auth/login">
            Login
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
