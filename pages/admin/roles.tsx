import React, { useEffect, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";

type RoleRow = { id: string; name: string };

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBaseUrl = getApiBaseUrl();
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiBaseUrl}/api/admin/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as RoleRow[];
        setRoles(json ?? []);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load roles."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <div className="app-loading">Loading roles...</div>;

  return (
    <AppShell requiredRole="Admin" title="Roles" subtitle="Read-only view of roles.">
      {error ? <div className="msg msg-error">{error}</div> : null}
      <div className="app-card">
        <ul>
          {roles.map((r) => (
            <li key={r.id}>{r.name}</li>
          ))}
        </ul>
        {!roles.length ? <p className="app-muted">No roles found.</p> : null}
      </div>
    </AppShell>
  );
}
