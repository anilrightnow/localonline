import React, { useMemo } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/AdminLayout";
import MonetizationDashboard from "@/components/monetization/MonetizationDashboard";
import { useRequireAuth } from "@/lib/auth";
import { getUserSessionFromToken } from "@/lib/session";
import {
  LayoutDashboard,
  DollarSign,
  List,
  MessageSquare,
  Settings,
} from "lucide-react";

// Define navigation items for the admin layout
const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Monetization", href: "/admin/monetization", icon: DollarSign },
  { label: "Listings", href: "/admin/listings", icon: List },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function MonetizationPage() {
  const router = useRouter();
  const { cid } = router.query;

  const { isAuthenticated, isChecking, token } = useRequireAuth();

  if (isChecking) {
    // Render a loading state while authentication is being checked
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    // The useRequireAuth hook handles redirection if not authenticated,
    // so we can return null here or a minimal message.
    return null;
  }

  const session = useMemo(() => getUserSessionFromToken(token), [token]);
  const userRole = session.roles.length > 0 ? session.roles[0] : "User"; // Use the first role found
  const userName = session.email || "Unknown User"; // Fallback if email is not available

  return (
    <AdminLayout
      title="Business Monetization"
      userRole={userRole}
      userName={userName}
      navItems={adminNavItems}
    >
      <div style={{ padding: "20px" }}>
        <MonetizationDashboard cid={String(cid || "")} />
      </div>
    </AdminLayout>
  );
}
