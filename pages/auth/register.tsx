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
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await axios.post(apiUrl("/api/auth/register"), { email, password });
      const returnUrl = typeof router.query.returnUrl === "string" ? router.query.returnUrl : "/profile";
      router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed"));
    }
  };

  return (
    <SiteShell>
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Join LocalOnline to claim listings and manage your presence.</p>
        </div>
        <FormMessage message={error} tone="error" />
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
