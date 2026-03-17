import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { getApiErrorMessage } from "../../lib/apiError";

const TwoFactorSetupPage = () => {
  const [step, setStep] = useState<"choose" | "totp" | "verify">("choose");
  const [totpKey, setTotpKey] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSetupTotp = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/auth/setup-totp",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTotpKey(response.data.key);
      setTotpUri(response.data.otpauth);
      setStep("totp");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to setup TOTP"));
    }
  };

  const handleVerifyTotp = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/auth/verify-totp",
        { token: verifyToken },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("TOTP verified successfully!");
      setTimeout(() => router.push("/profile"), 2000);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to verify TOTP token"));
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "20px" }}>
      <h2>Two-Factor Authentication Setup</h2>

      {step === "choose" && (
        <div>
          <p>Choose your authentication method:</p>
          <button
            onClick={handleSetupTotp}
            style={{ padding: "10px 20px", marginRight: "10px" }}
          >
            Setup Authenticator App (TOTP)
          </button>
          {message && <p style={{ color: "red" }}>{message}</p>}
        </div>
      )}

      {step === "totp" && (
        <div>
          <h3>Scan QR Code</h3>
          <p>
            Scan this QR code with your authenticator app (Google Authenticator,
            Microsoft Authenticator, Authy, etc.):
          </p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
              totpUri
            )}`}
            alt="QR Code"
            style={{ marginBottom: "20px" }}
          />
          <p>
            Or enter this key manually: <strong>{totpKey}</strong>
          </p>
          <div style={{ marginBottom: "15px" }}>
            <label>Enter verification code from your authenticator:</label>
            <input
              type="text"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              placeholder="000000"
              maxLength={6}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button onClick={handleVerifyTotp} style={{ padding: "10px 20px" }}>
            Verify Code
          </button>
          {message && (
            <p
              style={{
                color: message.includes("successfully") ? "green" : "red",
              }}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetupPage;
