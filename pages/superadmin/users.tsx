import React, { useEffect, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";

type UserRow = {
  id: string;
  email: string | null;
  userName: string | null;
  emailConfirmed: boolean;
  accessFailedCount: number;
  roles: string[];
};

type RoleRow = { id: string; name: string };

export default function SuperAdminUsersPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/superadmin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/admin/roles`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!usersRes.ok) throw new Error(await usersRes.text());
      if (!rolesRes.ok) throw new Error(await rolesRes.text());
      setUsers(((await usersRes.json()) as UserRow[]) ?? []);
      setRoles(((await rolesRes.json()) as RoleRow[]) ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadAll();
  }, [isAuthenticated]);

  async function saveRoles(userId: string, nextRoles: string[]) {
    setMessage(null);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const res = await fetch(`${apiBaseUrl}/api/superadmin/users/${encodeURIComponent(userId)}/roles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roles: nextRoles }),
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roles: nextRoles } : u)));
      setMessage("Roles updated.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update roles."));
    }
  }

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }
  if (loading) return <div className="app-loading">Loading users...</div>;

  return (
    <AppShell requiredRole="SuperAdmin" title="User Management" subtitle="Edit roles and access for all users.">
      {message ? <div className="msg msg-success">{message}</div> : null}
      {error ? <div className="msg msg-error">{error}</div> : null}
      <div className="app-card">
        {users.map((u) => (
          <div key={u.id} className="app-card" style={{ marginBottom: 12 }}>
            <h3>{u.email || u.userName || u.id}</h3>
            <p className="app-muted">Roles: {u.roles.join(", ") || "-"}</p>
            <div className="app-actions" style={{ flexWrap: "wrap" }}>
              {roles.map((r) => {
                const checked = u.roles.includes(r.name);
                return (
                  <label key={r.id} className="app-chip" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...u.roles, r.name]
                          : u.roles.filter((x) => x !== r.name);
                        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, roles: next } : x)));
                      }}
                    />
                    <span style={{ marginLeft: 6 }}>{r.name}</span>
                  </label>
                );
              })}
            </div>
            <div className="app-actions">
              <button className="btn btn-primary" type="button" onClick={() => void saveRoles(u.id, u.roles)}>
                Save Roles
              </button>
            </div>
          </div>
        ))}
        {!users.length ? <p className="app-muted">No users found.</p> : null}
      </div>
    </AppShell>
  );
}
