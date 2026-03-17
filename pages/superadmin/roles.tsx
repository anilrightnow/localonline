import React, { FormEvent, useEffect, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";

type RoleRow = { id: string; name: string };

export default function SuperAdminRolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRoles() {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBaseUrl}/api/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setRoles(((await res.json()) as RoleRow[]) ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load roles."));
    }
  }

  useEffect(() => {
    void loadRoles();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBaseUrl}/api/superadmin/roles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName("");
      setMessage("Role created.");
      await loadRoles();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create role."));
    }
  }

  return (
    <AppShell requiredRole="SuperAdmin" title="Role Management" subtitle="Create roles for assignment.">
      {message ? <div className="msg msg-success">{message}</div> : null}
      {error ? <div className="msg msg-error">{error}</div> : null}
      <div className="app-card">
        <form onSubmit={onCreate}>
          <div className="form-row">
            <label>Role Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Support" />
          </div>
          <button className="btn btn-primary" type="submit">Create Role</button>
        </form>
      </div>
      <div className="app-card">
        <h2>Existing Roles</h2>
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
