import { FormEvent, useEffect, useState } from "react";
import AppShell from "../../components/app/AppShell";
import PasswordField from "../../components/shared/PasswordField";
import FormField from "../../components/shared/FormField";
import FormMessage from "../../components/shared/FormMessage";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";

type SettingsResponse = {
  settings: Record<string, unknown>;
};

export default function SuperAdminSettingsPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
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
    if (!isAuthenticated) return;
    void loadSettings();
  }, [isAuthenticated]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
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

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }
  if (loading) return <div className="app-loading">Loading settings...</div>;

  return (
    <AppShell requiredRole="SuperAdmin" title="SuperAdmin Settings" subtitle="Central configuration for email and app defaults.">
      <FormMessage message={error} tone="error" />
      <FormMessage message={message} tone="success" />
      <form className="app-card" onSubmit={onSave}>
        <h2>App Settings</h2>
        <FormField label="Site Name">
          <input
            className="form-input"
            value={String(settings.site_name ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, site_name: e.target.value }))}
          />
        </FormField>
        <FormField label="Support Email">
          <input
            className="form-input"
            type="email"
            value={String(settings.support_email ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, support_email: e.target.value }))}
          />
        </FormField>
        <FormField label="Admin Alert Emails">
          <input
            className="form-input"
            placeholder="admin1@example.com, admin2@example.com"
            value={String(settings.admin_emails ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, admin_emails: e.target.value }))}
          />
        </FormField>
        <FormField label="Public Base URL">
          <input
            className="form-input"
            placeholder="https://example.com"
            value={String(settings.public_base_url ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, public_base_url: e.target.value }))}
          />
        </FormField>

        <h2 style={{ marginTop: 24 }}>SMTP (Email)</h2>
        <FormField label="SMTP Host">
          <input
            className="form-input"
            value={String(settings.smtp_host ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_host: e.target.value }))}
          />
        </FormField>
        <FormField label="SMTP Port">
          <input
            className="form-input"
            type="number"
            value={String(settings.smtp_port ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_port: Number(e.target.value) }))}
          />
        </FormField>
        <FormField label="SMTP User">
          <input
            className="form-input"
            value={String(settings.smtp_user ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_user: e.target.value }))}
          />
        </FormField>
        <PasswordField
          id="smtp-password"
          label="SMTP Password"
          value={String(settings.smtp_pass ?? "")}
          onChange={(value) => setSettings((prev) => ({ ...prev, smtp_pass: value }))}
          autoComplete="off"
        />
        <FormField label="SMTP Secure (TLS)">
          <select
            className="form-select"
            value={String(settings.smtp_secure ?? false)}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_secure: e.target.value === "true" }))}
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        </FormField>
        <FormField label="From Email">
          <input
            className="form-input"
            type="email"
            value={String(settings.smtp_from ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_from: e.target.value }))}
          />
        </FormField>
        <FormField label="From Name">
          <input
            className="form-input"
            value={String(settings.smtp_from_name ?? "")}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtp_from_name: e.target.value }))}
          />
        </FormField>

        <div className="app-actions">
          <button className="btn btn-primary" type="submit">Save Settings</button>
        </div>
      </form>
    </AppShell>
  );
}
