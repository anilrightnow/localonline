import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import SiteShell from "../../components/public/SiteShell";

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
      <div className="app-card" style={{ maxWidth: "420px", margin: "50px auto" }}>
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div className="form-row">
            <label>Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Confirm Password</label>
            <input
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="msg msg-error">{error}</div>}
          <button className="btn btn-primary" type="submit">
            Register
          </button>
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
