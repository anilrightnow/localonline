import React from "react";
import UserManagement from "../../components/app/UserManagement";

export default function AdminUsersPage() {
  return (
    <UserManagement
      canManageRoles={false}
      requiredRole="Admin"
      title="User Management"
      subtitle="Search users, roles, login status, and activity."
    />
  );
}
