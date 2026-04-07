import { FormEvent, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import SiteShell from "../../components/public/SiteShell";
import PasswordField from "../../components/shared/PasswordField";
import FormField from "../../components/shared/FormField";
import FormMessage from "../../components/shared/FormMessage";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setMessageType("");
    try {
      const response = await axios.post(apiUrl("/api/auth/reset-password"), {
        email,
        token,
        newPassword,
      });
      setMessage(response.data?.message ?? "Password reset successful.");
      setMessageType("success");
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Password reset failed."));
      setMessageType("error");
    }
  }

  return (
    <SiteShell>
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">Enter the token sent to your email to set a new password.</p>
        </div>
        <FormMessage message={message} tone={messageType === "error" ? "error" : "success"} />
        <form onSubmit={onSubmit} className="auth-form">
          <FormField id="reset-email" label="Email">
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </FormField>
          <FormField id="reset-token" label="Reset Token" helpText="Check your email for the verification token.">
            <input
              id="reset-token"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="form-input"
            />
          </FormField>
          <PasswordField
            id="reset-password"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            required
            minLength={8}
            autoComplete="new-password"
            showStrength
            hasError={messageType === "error"}
          />
          <div className="auth-actions">
            <button className="btn btn-primary" type="submit">
              Reset Password
            </button>
          </div>
        </form>
        <div className="auth-links">
          <Link className="btn btn-ghost" href="/auth/login">
            Back to login
          </Link>
          <Link className="btn btn-ghost" href="/auth/forgot-password">
            Forgot password
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
