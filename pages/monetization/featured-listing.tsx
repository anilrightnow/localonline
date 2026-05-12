import React from "react";
import AdminLayout from "@/AdminLayout"; // Assuming this path for AdminLayout
import FeaturedListingCheckout from "@/components/monetization/FeaturedListingCheckout";
import { useRequireAuth } from "@/lib/auth";
import { getUserSessionFromToken } from "@/lib/session";
import {
  LayoutDashboard,
  DollarSign,
  List,
  MessageSquare,
  Settings,
} from "lucide-react";

// Define a placeholder for navItems. In a real application, this would likely
// be a more comprehensive list of navigation links for the admin dashboard,
// potentially filtered by user roles.
const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Monetization", href: "/admin/monetization", icon: DollarSign },
  { label: "Listings", href: "/admin/listings", icon: List },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function FeaturedListingPage() {
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

  const session = getUserSessionFromToken(token);
  const userRole = session.roles.length > 0 ? session.roles[0] : "User"; // Use the first role found
  const userName = session.email || "Unknown User"; // Fallback if email is not available

  return (
    <AdminLayout
      title="Featured Listing Checkout"
      userRole={userRole}
      userName={userName}
      navItems={adminNavItems}
    >
      <FeaturedListingCheckout />
    </AdminLayout>
  );
}
