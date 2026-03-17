import { FormEvent, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { getApiErrorMessage } from "../../lib/apiError";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string>("");
  const [token, setToken] = useState<string>("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setToken("");
    try {
      const response = await axios.post("/api/auth/forgot-password", { email });
      setMessage(response.data?.message ?? "Reset token generated.");
      setToken(response.data?.resetToken ?? "");
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Unable to process request."));
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 16 }}>
      <h1>Forgot Password</h1>
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
        <button type="submit">Generate Reset Token</button>
      </form>
      {message ? <p>{message}</p> : null}
      {token ? (
        <p>
          Reset token: <code>{token}</code>
        </p>
      ) : null}
      <p>
        <Link href="/auth/reset-password">Go to reset password page</Link>
      </p>
    </div>
  );
}
