import React, { useEffect, useMemo, useState } from "react";
import AppShell, { RoleRequirement } from "./AppShell";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";
import FormMessage from "../shared/FormMessage";

interface UserRow {
  id: string;
  email: string;
  role?: string;
  roles?: string[];
  emailConfirmed?: boolean;
  phoneNumber?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
}

interface UserManagementProps {
  canManageRoles: boolean;
  requiredRole: RoleRequirement;
  title: string;
  subtitle: string;
}

export default function UserManagement({
  canManageRoles,
  requiredRole,
  title,
  subtitle,
}: UserManagementProps) {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [verifiedFilter, setVerifiedFilter] = useState("All");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize)),
    [pagination],
  );

  const loadUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pagination.pageSize));
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (verifiedFilter !== "All") params.set("isVerified", verifiedFilter);
      params.set("sort", sort);
      params.set("order", order);

      const queryString = params.toString();
      const url = `${apiBaseUrl}/api/admin/users${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.items;
      setUsers((items as UserRow[]) ?? []);

      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void loadUsers();
    }
  }, [isAuthenticated]); // Only re-run on auth state change

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  return (
    <AppShell requiredRole={requiredRole} title={title} subtitle={subtitle}>
      {error ? <FormMessage message={error} tone="error" /> : null}

      <div className="app-card" style={{ marginBottom: 16 }}>
        <div className="app-grid">
          <div className="form-row">
            <label>Search</label>
            <input
              className="form-input"
              placeholder="Email or User ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadUsers(1)}
            />
          </div>
          <div className="form-row">
            <label>Role</label>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="User">User</option>
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>
          </div>
          <div className="form-row">
            <label>Sort</label>
            <select
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="createdAt">Created date</option>
              <option value="email">Email</option>
              <option value="lastLoginAt">Last login</option>
            </select>
          </div>
          <div className="form-row">
            <label>Order</label>
            <select
              className="form-select"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>
        <div className="app-actions" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => void loadUsers(1)}
            disabled={loading}
          >
            {loading ? "Searching..." : "Apply Filters"}
          </button>
        </div>
      </div>

      <div className="app-card">
        {loading ? (
          <p className="app-loading">Loading users...</p>
        ) : (
          <div className="pub-table-wrap">
            <table className="pub-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Confirmed</th>
                  <th>Roles</th>
                  <th>Phone</th>
                  <th>Last Login</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(users) &&
                  users.map((user) => (
                    <tr key={user.id}>
                      <td
                        title={user.id}
                        style={{
                          fontSize: "11px",
                          fontFamily: "monospace",
                          opacity: 0.6,
                        }}
                      >
                        {user.id.slice(0, 8)}...
                      </td>
                      <td>{user.email}</td>
                      <td style={{ textAlign: "center" }}>
                        {user.emailConfirmed ? "✅" : "❌"}
                      </td>
                      <td>
                        {user.roles && user.roles.length > 0
                          ? user.roles.join(", ")
                          : user.role || (
                              <span className="app-muted">User</span>
                            )}
                      </td>
                      <td>
                        {user.phoneNumber || (
                          <span className="app-muted">-</span>
                        )}
                      </td>
                      <td>
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {(!users || !users.length) && (
              <p className="app-muted">No users found.</p>
            )}
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="app-actions" style={{ marginTop: 12 }}>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => void loadUsers(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1 || loading}
            >
              Previous
            </button>
            <span className="pub-muted">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() =>
                void loadUsers(Math.min(totalPages, pagination.page + 1))
              }
              disabled={pagination.page >= totalPages || loading}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
