import { FormEvent, useState } from "react";
import axios from "axios";
import { getApiErrorMessage } from "../../lib/apiError";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await axios.post("/api/auth/reset-password", {
        email,
        token,
        newPassword,
      });
      setMessage(response.data?.message ?? "Password reset successful.");
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Password reset failed."));
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 16 }}>
      <h1>Reset Password</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 12 }}
        />
        <label htmlFor="token">Reset Token</label>
        <input
          id="token"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 12 }}
        />
        <label htmlFor="new-password">New Password</label>
        <input
          id="new-password"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 12 }}
        />
        <button type="submit">Reset Password</button>
      </form>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
