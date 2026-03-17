import { FormEvent, useEffect, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";

type SettingsResponse = {
  settings: Record<string, unknown>;
};

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBaseUrl}/api/superadmin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      const json = (await response.json()) as SettingsResponse;
      setSettings(json.settings ?? {});
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load settings."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBaseUrl}/api/superadmin/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) throw new Error(await response.text());
      setMessage("Settings saved.");
      await loadSettings();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save settings."));
    }
  }

  if (loading) return <div className="app-loading">Loading settings...</div>;

  return (
    <AppShell requiredRole="SuperAdmin" title="SuperAdmin Settings" subtitle="Central configuration for email and app defaults.">
      {message ? <div className="msg msg-success">{message}</div> : null}
      {error ? <div className="msg msg-error">{error}</div> : null}
      <form className="app-card" onSubmit={onSave}>
        <h2>App Settings</h2>
        <div className="form-row">
          <label>Site Name</label>
          <input
            className="form-input"
            value={String(settings.site_name ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, site_name: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <label>Support Email</label>
          <input
            className="form-input"
            type="email"
            value={String(settings.support_email ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, support_email: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <label>Public Base URL</label>
          <input
            className="form-input"
            placeholder="https://example.com"
            value={String(settings.public_base_url ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, public_base_url: e.target.value }))}
          />
        </div>

        <h2 style={{ marginTop: 24 }}>SMTP (Email)</h2>
        <div className="form-row">
          <label>SMTP Host</label>
          <input
            className="form-input"
            value={String(settings.smtp_host ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_host: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <label>SMTP Port</label>
          <input
            className="form-input"
            type="number"
            value={String(settings.smtp_port ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_port: Number(e.target.value) }))}
          />
        </div>
        <div className="form-row">
          <label>SMTP User</label>
          <input
            className="form-input"
            value={String(settings.smtp_user ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_user: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <label>SMTP Password</label>
          <input
            className="form-input"
            type="password"
            value={String(settings.smtp_pass ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_pass: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <label>SMTP Secure (TLS)</label>
          <select
            className="form-select"
            value={String(settings.smtp_secure ?? false)}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_secure: e.target.value === "true" }))}
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        </div>
        <div className="form-row">
          <label>From Email</label>
          <input
            className="form-input"
            type="email"
            value={String(settings.smtp_from ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_from: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <label>From Name</label>
          <input
            className="form-input"
            value={String(settings.smtp_from_name ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_from_name: e.target.value }))}
          />
        </div>

        <div className="app-actions">
          <button className="btn btn-primary" type="submit">Save Settings</button>
        </div>
      </form>
    </AppShell>
  );
}
