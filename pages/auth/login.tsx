import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { getApiErrorMessage } from "../../lib/apiError";
import { setAuthTokenCookie } from "../../lib/auth";
import { apiUrl } from "../../lib/apiClient";
import SiteShell from "../../components/public/SiteShell";
import PasswordField from "../../components/shared/PasswordField";
import FormField from "../../components/shared/FormField";
import FormMessage from "../../components/shared/FormMessage";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResendLink, setShowResendLink] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setShowResendLink(false);
    try {
      const response = await axios.post(apiUrl("/api/auth/login"), {
        email,
        password,
      });
      setAuthTokenCookie(response.data.access_token);
      const returnUrl =
        typeof router.query.returnUrl === "string"
          ? router.query.returnUrl
          : "/dashboard";
      router.push(returnUrl);
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, "Invalid email or password");
      setError(errorMessage);
      if (axios.isAxiosError(err) && err.response?.data?.needsVerification) {
        setShowResendLink(true);
      }
    }
  };

  const handleResendVerification = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setMessage("Sending a new verification email...");
    setShowResendLink(false);

    try {
      const { data } = await axios.post(
        apiUrl("/api/auth/resend-verification"),
        { email },
      );
      setMessage(data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send verification email."));
      setMessage(null);
    }
  };

  return (
    <SiteShell>
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">
            Sign in to manage your account and listings.
          </p>
        </div>
        <FormMessage message={error} tone="error" />
        <FormMessage message={message} tone="success" />
        <form onSubmit={handleLogin} className="auth-form">
          <FormField id="login-email" label="Email">
            <input
              className="form-input"
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
            helpText="Use the password you created during registration."
            hasError={Boolean(error)}
          />
          <div className="auth-actions">
            <button className="btn btn-primary" type="submit">
              Login
            </button>
          </div>
          {showResendLink && (
            <div className="auth-extra-action">
              <a href="#" onClick={handleResendVerification}>
                Resend verification email
              </a>
            </div>
          )}
        </form>
        <div className="auth-links">
          <Link className="btn btn-ghost" href="/auth/forgot-password">
            Forgot password
          </Link>
          <Link className="btn btn-ghost" href="/auth/register">
            Register
          </Link>
        </div>
      </div>
    </SiteShell>
  );
};

export default LoginPage;
