import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { getApiErrorMessage } from "../../lib/apiError";
import { setAuthTokenCookie } from "../../lib/auth";
import { apiUrl } from "../../lib/apiClient";
import SiteShell from "../../components/public/SiteShell";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(apiUrl("/api/auth/login"), { email, password });
      setAuthTokenCookie(response.data.access_token);
      const returnUrl = typeof router.query.returnUrl === "string" ? router.query.returnUrl : "/profile";
      router.push(returnUrl);
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid email or password"));
    }
  };

  return (
    <SiteShell>
      <div className="app-card" style={{ maxWidth: "420px", margin: "50px auto" }}>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
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
          {error && <div className="msg msg-error">{error}</div>}
          <button className="btn btn-primary" type="submit">
            Login
          </button>
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
