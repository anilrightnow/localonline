import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

export default function AdminLayout({
  children,
  userRole,
  userName,
  navItems,
  title,
  subtitle,
  onLogout,
}: {
  children: React.ReactNode;
  userRole: string;
  userName: string;
  navItems: AdminNavItem[];
  title?: string;
  subtitle?: string;
  onLogout?: () => void;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = router.pathname;

  const currentPage = useMemo(() => {
    if (title) return title;
    return (
      navItems.find((item) => item.href === pathname)?.label || "Dashboard"
    );
  }, [navItems, pathname, title]);
  const displayName = userName?.trim() ? userName : "User";
  const initials = displayName
    .split("@")[0]
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const subtitleText =
    subtitle ??
    (pathname === "/admin/dashboard" || pathname === "/dashboard"
      ? `Welcome back! Here's what's happening with your workspace today.`
      : `Manage your ${currentPage.toLowerCase()} and system configurations.`);

  return (
    <div className="admin-shell">
      <aside
        className={`admin-sidebar ${isSidebarOpen ? "is-open" : "is-collapsed"}`}
      >
        <div className="admin-brand">
          <div className="admin-brand-icon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="" />
          </div>
          {isSidebarOpen && (
            <span className="admin-brand-text">
              <span>LocalOnline</span>
              <small>{userRole} workspace</small>
            </span>
          )}
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`admin-nav-link ${isActive ? "is-active" : ""}`}
              >
                <item.icon size={20} className="admin-nav-icon" />
                {isSidebarOpen && (
                  <span className="admin-nav-label">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="admin-user">
          <div className="admin-user-avatar">
            {initials || displayName.charAt(0)}
          </div>
          {isSidebarOpen && (
            <div className="admin-user-meta">
              <p className="admin-user-name">{displayName}</p>
              <p className="admin-user-role">{userRole}</p>
            </div>
          )}
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="admin-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="admin-main">
        <header className="admin-topbar glass">
          <div className="admin-topbar-left">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="admin-toggle"
              aria-label="Toggle Sidebar"
              type="button"
            >
              <Menu size={20} />
            </button>
            <div className="admin-breadcrumbs">
              <span className="admin-breadcrumbs-label">Pages</span>
              <span className="admin-breadcrumbs-sep">/</span>
              <span className="admin-breadcrumbs-current">{currentPage}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button
              className="admin-icon-btn"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="admin-icon-dot" />
            </button>

            <div className="admin-divider" />

            <div className="admin-account">
              <button className="admin-account-btn" type="button">
                <span className="admin-account-label">Account</span>
                <span className="admin-account-avatar-wrap">
                  <UserIcon size={16} />
                </span>
                <ChevronDown size={14} className="admin-account-caret" />
              </button>

              <div className="admin-menu">
                <Link href="/profile" className="admin-menu-link">
                  <UserIcon size={16} /> My Profile
                </Link>
                <Link href="/settings" className="admin-menu-link">
                  <Settings size={16} /> Settings
                </Link>
                <div className="admin-menu-sep" />
                <button
                  className="admin-menu-logout"
                  onClick={onLogout}
                  type="button"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-page">
            <div className="admin-page-header">
              <h1 className="admin-title">{currentPage}</h1>
              <p className="admin-subtitle">{subtitleText}</p>
            </div>
            <div className="admin-fade-in">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
