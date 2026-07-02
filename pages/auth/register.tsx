import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import SiteShell from "../../components/public/SiteShell";
import PasswordField from "../../components/shared/PasswordField";
import FormField from "../../components/shared/FormField";
import FormMessage from "../../components/shared/FormMessage";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResendLink, setShowResendLink] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setShowResendLink(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const { data } = await axios.post(apiUrl("/api/auth/register"), {
        email,
        password,
      });
      setMessage(
        data.message ||
          "Registration successful! Please check your email to confirm.",
      );
      // Optionally redirect to login or a confirmation page
      // router.push('/auth/login');
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, "Registration failed");
      setError(errorMessage);
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 409 &&
        err.response?.data?.needsVerification
      ) {
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
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">
            Join LocalOnline to claim listings and manage your presence.
          </p>
        </div>
        <FormMessage message={error} tone="error" />
        <FormMessage message={message} tone="success" />
        <form onSubmit={handleRegister} className="auth-form">
          <FormField id="register-email" label="Email">
            <input
              className="form-input"
              type="email"
              id="register-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <PasswordField
            id="register-password"
            label="Password"
            value={password}
            onChange={setPassword}
            required
            minLength={8}
            autoComplete="new-password"
            helpText="Use at least 8 characters for stronger security."
            showStrength
            hasError={Boolean(error)}
          />
          <PasswordField
            id="register-confirm"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            autoComplete="new-password"
            hasError={Boolean(error)}
          />
          <div className="auth-actions">
            <button className="btn btn-primary" type="submit">
              Register
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
          <Link className="btn btn-ghost" href="/auth/login">
            Login
          </Link>
        </div>
      </div>
    </SiteShell>
  );
};

export default RegisterPage;
