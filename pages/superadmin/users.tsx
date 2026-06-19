import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";
import FormMessage from "../../components/shared/FormMessage";

type UserRow = {
  id: string;
  email: string | null;
  userName: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  mobile: string | null;
  gender: string | null;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  roles: string[];
};

type RoleRow = { id: string; name: string };
type Pagination = { page: number; pageSize: number; totalCount: number };
type UsersResponse = { items: UserRow[]; pagination: Pagination };

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatBool(value: boolean) {
  return value ? "Yes" : "No";
}

export default function SuperAdminUsersPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, totalCount: 0 });
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [confirmed, setConfirmed] = useState("");
  const [sort, setSort] = useState("email");
  const [order, setOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize)),
    [pagination],
  );

  async function loadUsers(page = pagination.page) {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
        sort,
        order,
      });
      if (query.trim()) params.set("q", query.trim());
      if (role) params.set("role", role);
      if (confirmed) params.set("confirmed", confirmed);
      const res = await fetch(`${getApiBaseUrl()}/api/superadmin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as UsersResponse | UserRow[];
      if (Array.isArray(json)) {
        setUsers(json);
        setPagination({ page, pageSize: pagination.pageSize, totalCount: json.length });
      } else {
        setUsers(json.items ?? []);
        setPagination(json.pagination ?? { page, pageSize: pagination.pageSize, totalCount: 0 });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`${getApiBaseUrl()}/api/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setRoles(((await res.json()) as RoleRow[]) ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load roles."));
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadRoles();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadUsers(1);
  }, [isAuthenticated, role, confirmed, sort, order, pagination.pageSize]);

  async function saveRoles(userId: string, nextRoles: string[]) {
    setMessage(null);
    setError(null);
    setSavingUserId(userId);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const res = await fetch(`${getApiBaseUrl()}/api/superadmin/users/${encodeURIComponent(userId)}/roles`, {
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
    } finally {
      setSavingUserId(null);
    }
  }

  function toggleRole(userId: string, roleName: string, checked: boolean) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const next = checked
          ? Array.from(new Set([...u.roles, roleName]))
          : u.roles.filter((item) => item !== roleName);
        return { ...u, roles: next };
      }),
    );
  }

  if (isChecking || !isAuthenticated) return <div className="app-loading">Redirecting to login...</div>;

  return (
    <AppShell requiredRole="SuperAdmin" title="User Management" subtitle="Filter users, inspect activity, and manage roles.">
      {message ? <FormMessage message={message} tone="success" /> : null}
      {error ? <FormMessage message={error} tone="error" /> : null}
      <div className="app-card">
        <div className="app-actions" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
          <label style={{ minWidth: 240 }}>
            <span className="app-muted">Search</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Email, name, phone, or ID" />
          </label>
          <label>
            <span className="app-muted">Role</span>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              {roles.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="app-muted">Email</span>
            <select className="form-select" value={confirmed} onChange={(e) => setConfirmed(e.target.value)}>
              <option value="">Any</option>
              <option value="yes">Confirmed</option>
              <option value="no">Not confirmed</option>
            </select>
          </label>
          <label>
            <span className="app-muted">Sort</span>
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="email">Email</option>
              <option value="username">User name</option>
              <option value="lastLogin">Last login</option>
              <option value="lastActivity">Last activity</option>
              <option value="failedLogins">Failed logins</option>
            </select>
          </label>
          <label>
            <span className="app-muted">Order</span>
            <select className="form-select" value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </label>
          <button className="btn btn-primary" type="button" onClick={() => void loadUsers(1)} disabled={loading}>
            Apply
          </button>
        </div>
      </div>

      <div className="app-card">
        {loading ? <p className="app-muted">Loading users...</p> : null}
        <div style={{ overflowX: "auto" }}>
          <table className="app-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Roles</th>
                <th>Email Confirmed</th>
                <th>2FA</th>
                <th>Failed Logins</th>
                <th>Last Login</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.email || "-"}</strong>
                    <div className="app-muted">{u.id}</div>
                  </td>
                  <td>
                    {u.fullName || u.userName || "-"}
                    {u.gender ? <div className="app-muted">{u.gender}</div> : null}
                  </td>
                  <td>{u.phoneNumber || u.mobile || "-"}</td>
                  <td>
                    <div className="app-actions" style={{ gap: 6, flexWrap: "wrap" }}>
                      {roles.map((item) => (
                        <label key={item.id} className="app-chip" style={{ cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={u.roles.includes(item.name)}
                            onChange={(e) => toggleRole(u.id, item.name, e.target.checked)}
                          />
                          <span style={{ marginLeft: 6 }}>{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td>{formatBool(u.emailConfirmed)}</td>
                  <td>{formatBool(u.twoFactorEnabled)}</td>
                  <td>{u.accessFailedCount}</td>
                  <td>{formatDate(u.lastLoginAt)}</td>
                  <td>{formatDate(u.lastActivityAt)}</td>
                  <td>
                    <button className="btn btn-primary" type="button" disabled={savingUserId === u.id} onClick={() => void saveRoles(u.id, u.roles)}>
                      {savingUserId === u.id ? "Saving..." : "Save Roles"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !users.length ? <p className="app-muted">No users found.</p> : null}
        <div className="app-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-secondary" type="button" onClick={() => void loadUsers(Math.max(1, pagination.page - 1))} disabled={loading || pagination.page <= 1}>
            Previous
          </button>
          <span className="app-muted">Page {pagination.page} of {totalPages} / {pagination.totalCount} users</span>
          <button className="btn btn-secondary" type="button" onClick={() => void loadUsers(Math.min(totalPages, pagination.page + 1))} disabled={loading || pagination.page >= totalPages}>
            Next
          </button>
          <select className="form-select" style={{ maxWidth: 110 }} value={pagination.pageSize} onChange={(e) => setPagination((prev) => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </AppShell>
  );
}
