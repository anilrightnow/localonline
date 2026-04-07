import React, { useEffect, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";
import FormMessage from "../../components/shared/FormMessage";

type UserRow = {
  id: string;
  email: string | null;
  userName: string | null;
  emailConfirmed: boolean;
  accessFailedCount: number;
  roles: string[];
};

export default function AdminUsersPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBaseUrl = getApiBaseUrl();
        const token = getAuthToken();
        if (!token) throw new Error("Not authenticated.");
        const res = await fetch(`${apiBaseUrl}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as UserRow[];
        setUsers(json ?? []);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load users."));
      } finally {
        setLoading(false);
      }
    };
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated]);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }
  if (loading) return <div className="app-loading">Loading users...</div>;

  return (
    <AppShell requiredRole="Admin" title="Users" subtitle="Read-only view of users and roles.">
      {error ? <FormMessage message={error} tone="error" /> : null}
      <div className="app-card">
        <table className="app-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>UserName</th>
              <th>Roles</th>
              <th>Email Confirmed</th>
              <th>Failed Logins</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email || "-"}</td>
                <td>{u.userName || "-"}</td>
                <td>{u.roles.join(", ") || "-"}</td>
                <td>{u.emailConfirmed ? "Yes" : "No"}</td>
                <td>{u.accessFailedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length ? <p className="app-muted">No users found.</p> : null}
      </div>
    </AppShell>
  );
}
