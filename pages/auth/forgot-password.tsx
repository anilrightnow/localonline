import { FormEvent, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import SiteShell from "../../components/public/SiteShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await axios.post(apiUrl("/api/auth/forgot-password"), { email });
      setMessage(response.data?.message ?? "Reset instructions sent. Check your email.");
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Unable to process request."));
    }
  }

  return (
    <SiteShell>
      <div className="app-card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h1>Forgot Password</h1>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Send reset email
          </button>
        </form>
        {message ? <div className="msg msg-success">{message}</div> : null}
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
