import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  AlertTriangle,
  Bell,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCog,
  User as UserIcon,
} from "lucide-react";
import AppShell from "../components/app/AppShell";
import PasswordField from "../components/shared/PasswordField";
import FormField from "../components/shared/FormField";
import FormMessage from "../components/shared/FormMessage";
import { getApiErrorMessage } from "../lib/apiError";
import {
  clearAuthTokenCookie,
  getAuthToken,
  useRequireAuth,
} from "../lib/auth";
import { apiFetch } from "../lib/apiClient";
import {
  getUserSessionFromToken,
  hasRole,
} from "../lib/session";
import type { UserSession } from "../lib/session";

type SectionId =
  | "profile"
  | "security"
  | "notifications"
  | "billing"
  | "business"
  | "admin"
  | "platform"
  | "account";

interface UserProfile {
  id: string;
  userName?: string | null;
  email?: string | null;
  fullName?: string | null;
  mobile?: string | null;
  dob?: string | null;
  gender?: string | null;
  twoFactorEnabled?: boolean;
  createdAt?: string | null;
}

interface SubscriptionState {
  planName: string;
  status: string;
}

const NOTIFICATION_PREF_KEY = "lo_notifications";

function readNotificationPrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATION_PREF_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const { isChecking, isAuthenticated } = useRequireAuth();
  const session: UserSession = useMemo(
    () => getUserSessionFromToken(getAuthToken()),
    [],
  );

  const isOwner = session.roles.includes("Owner");
  const isAdmin = hasRole(session, "Admin");
  const isSuperAdmin = hasRole(session, "SuperAdmin");

  const roleLabel = isSuperAdmin
    ? "SuperAdmin"
    : isAdmin
      ? "Admin"
      : isOwner
        ? "Owner"
        : "User";

  const [active, setActive] = useState<SectionId>("profile");
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Sync the active section with the URL (?section=...) for deep links.
  useEffect(() => {
    const section = router.query.section;
    const allowed: SectionId[] = [
      "profile",
      "security",
      "notifications",
      "billing",
      "business",
      "admin",
      "platform",
      "account",
    ];
    if (typeof section === "string" && allowed.includes(section as SectionId)) {
      setActive(section as SectionId);
    }
  }, [router.query.section]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const response = await apiFetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const json = (await response.json()) as UserProfile & { emailConfirmed?: boolean };
          if (mounted) setEmailConfirmed(Boolean(json.emailConfirmed));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
  }, []);

  function selectSection(id: SectionId) {
    setActive(id);
    const query = { ...router.query, section: id };
    void router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  }

  async function handleResendVerification() {
    setResendingVerification(true);
    setResendMessage(null);
    try {
      const token = getAuthToken();
      if (!token || !session.email) return;
      const response = await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.email }),
      });
      if (!response.ok) throw new Error(await response.text());
      setResendMessage("Verification email sent. Please check your inbox.");
    } catch (err) {
      setResendMessage(getApiErrorMessage(err, "Could not resend verification email."));
    } finally {
      setResendingVerification(false);
    }
  }

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Loading workspace...</div>;
  }

  return (
    <AppShell
      title="Settings"
      subtitle="Manage your profile, security, preferences, and account across LocalOnline."
    >
      <div className="settings-rolebar">
        <span className={`role-badge role-${roleLabel.toLowerCase()}`}>
          {roleLabel}
        </span>
        <span className="settings-rolebar-text">
          Signed in as{" "}
          <strong>{session.email ?? "this account"}</strong>
        </span>
      </div>

      {emailConfirmed === false && (
        <div className="app-card settings-verify-banner">
          <Mail size={20} />
          <div>
            <p className="settings-verify-title">Verify your email address</p>
            <p className="settings-verify-sub">
              Please confirm your email to unlock all features. Check your inbox for the verification link.
            </p>
            {resendMessage && (
              <p className={`app-note ${resendMessage.toLowerCase().includes("sent") ? "is-info" : "is-warn"}`}>
                {resendMessage}
              </p>
            )}
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleResendVerification}
            disabled={resendingVerification}
          >
            {resendingVerification ? "Sending..." : "Resend email"}
          </button>
        </div>
      )}

      <div className="settings-content">
          {active === "profile" && (
            <ProfileSection
              key={`profile-${session.email}`}
              onNavigate={selectSection}
            />
          )}
          {active === "security" && <SecuritySection email={session.email} />}
          {active === "notifications" && <NotificationsSection />}
          {active === "billing" && <BillingSection />}
          {active === "business" && <BusinessSection />}
          {active === "admin" && <AdminSection />}
          {active === "platform" && <PlatformSection />}
          {active === "account" && (
            <AccountSection
              email={session.email}
              roleLabel={roleLabel}
              onNavigate={selectSection}
            />
          )}
        </div>
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────
 * Profile
 * ───────────────────────────────────────────────────────── */
function ProfileSection({
  onNavigate,
}: {
  onNavigate: (id: SectionId) => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await apiFetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      const json = (await response.json()) as UserProfile;
      setProfile(json);
      setUserName(json.userName ?? "");
      setEmail(json.email ?? "");
      setFullName(json.fullName ?? "");
      setMobile(json.mobile ?? "");
      setDob(json.dob ? new Date(json.dob).toISOString().slice(0, 10) : "");
      setGender(json.gender ?? "");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          email,
          fullName,
          mobile,
          dob: dob || null,
          gender,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      setSuccess("Profile updated successfully.");
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="app-loading">Loading profile...</div>;

  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>Profile</h2>
        <p>
          Update your personal details and how your account appears across
          LocalOnline.
        </p>
      </header>

      <FormMessage message={error} tone="error" />
      <FormMessage message={success} tone="success" />

      <div className="app-card">
        <div className="profile-avatar-block">
          <div className="profile-avatar">
            {(fullName || email || userName || "U")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <p className="profile-avatar-name">
              {fullName || userName || "LocalOnline member"}
            </p>
            <p className="profile-avatar-sub">
              Member since{" "}
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>

        <form onSubmit={save} className="settings-form">
          <div className="settings-form-grid">
            <FormField label="Full Name">
              <input
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </FormField>
            <FormField label="Username">
              <input
                className="form-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </FormField>
            <FormField label="Email">
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField label="Mobile">
              <input
                className="form-input"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 ..."
              />
            </FormField>
            <FormField label="Date of Birth">
              <input
                className="form-input"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </FormField>
            <FormField label="Gender">
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="PreferNotToSay">Prefer not to say</option>
              </select>
            </FormField>
          </div>

          <div className="settings-form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="spin" /> Saving
                </>
              ) : (
                "Save changes"
              )}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => onNavigate("security")}
            >
              Manage security
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
 * Security
 * ───────────────────────────────────────────────────────── */
function SecuritySection({ email }: { email?: string | null }) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [twoFactorStep, setTwoFactorStep] = useState<"idle" | "verify">(
    "idle",
  );
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);

  const [rememberDevice, setRememberDevice] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const response = await apiFetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const json = (await response.json()) as UserProfile;
          if (mounted) setTwoFactorEnabled(Boolean(json.twoFactorEnabled));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      setRememberDevice(Boolean(localStorage.getItem("rememberedEmail")));
    } catch {
      setRememberDevice(false);
    }
  }, []);

  async function enableTwoFactor() {
    setTwoFactorBusy(true);
    setTwoFactorMessage(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await apiFetch("/api/auth/enable-2fa", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      setTwoFactorStep("verify");
      setTwoFactorMessage(
        "We sent a 6-digit verification code to your email. Enter it below to finish setup.",
      );
    } catch (err) {
      setTwoFactorMessage(getApiErrorMessage(err, "Could not start 2FA."));
    } finally {
      setTwoFactorBusy(false);
    }
  }

  async function verifyTwoFactor() {
    setTwoFactorBusy(true);
    setTwoFactorMessage(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await apiFetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: twoFactorCode }),
      });
      if (!response.ok) throw new Error(await response.text());
      setTwoFactorEnabled(true);
      setTwoFactorStep("idle");
      setTwoFactorCode("");
      setTwoFactorMessage("Two-factor authentication is now enabled.");
    } catch (err) {
      setTwoFactorMessage(getApiErrorMessage(err, "Invalid code."));
    } finally {
      setTwoFactorBusy(false);
    }
  }

  async function disableTwoFactor() {
    setTwoFactorBusy(true);
    setTwoFactorMessage(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await apiFetch("/api/auth/disable-totp", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      setTwoFactorEnabled(false);
      setTwoFactorMessage("Two-factor authentication has been disabled.");
    } catch (err) {
      setTwoFactorMessage(getApiErrorMessage(err, "Could not disable 2FA."));
    } finally {
      setTwoFactorBusy(false);
    }
  }

  function toggleRememberDevice(next: boolean) {
    setRememberDevice(next);
    try {
      if (next) {
        const current = email || localStorage.getItem("rememberedEmail");
        if (current) localStorage.setItem("rememberedEmail", current);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
    } catch {
      /* ignore */
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await apiFetch("/api/user/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });
      if (!response.ok) throw new Error(await response.text());
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to change password."));
    }
  }

  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>Security</h2>
        <p>Keep your account safe with a strong password and 2FA.</p>
      </header>

      <FormMessage message={error} tone="error" />
      <FormMessage message={success} tone="success" />

      <div className="app-card">
        <h3 className="settings-block-title">
          <Lock size={18} /> Password
        </h3>
        <form onSubmit={changePassword} className="settings-form">
          <PasswordField
            id="settings-current-password"
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
            autoComplete="current-password"
            hasError={Boolean(error)}
          />
          <PasswordField
            id="settings-new-password"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            required
            minLength={6}
            autoComplete="new-password"
            showStrength
            hasError={Boolean(error)}
          />
          <div className="settings-form-actions">
            <button className="btn btn-primary" type="submit">
              Update password
            </button>
            <Link className="btn btn-ghost" href="/auth/forgot-password">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>

      <div className="app-card">
        <h3 className="settings-block-title">
          <Fingerprint size={18} /> Two-Factor Authentication
        </h3>
        <div className="settings-row">
          <div className="settings-row-text">
            <p className="settings-row-title">
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </p>
            <p className="settings-row-sub">
              Require a one-time email code at sign-in for extra protection.
            </p>
          </div>
          <span
            className={`status-pill ${
              twoFactorEnabled ? "is-on" : "is-off"
            }`}
          >
            {twoFactorEnabled ? "On" : "Off"}
          </span>
        </div>

        {twoFactorStep === "verify" && (
          <div className="settings-inline-form">
            <FormField label="Verification code">
              <input
                className="form-input"
                inputMode="numeric"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) =>
                  setTwoFactorCode(e.target.value.replace(/\D/g, ""))
                }
                placeholder="000000"
              />
            </FormField>
            <div className="settings-form-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={verifyTwoFactor}
                disabled={twoFactorBusy || twoFactorCode.length !== 6}
              >
                {twoFactorBusy ? (
                  <>
                    <Loader2 size={16} className="spin" /> Verifying
                  </>
                ) : (
                  "Verify & enable"
                )}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setTwoFactorStep("idle");
                  setTwoFactorCode("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {twoFactorMessage && (
          <p
            className={`settings-note ${
              twoFactorMessage.toLowerCase().includes("enabled") ||
              twoFactorMessage.toLowerCase().includes("sent")
                ? "is-info"
                : "is-warn"
            }`}
          >
            {twoFactorMessage}
          </p>
        )}

        {twoFactorStep === "idle" && (
          <div className="settings-form-actions">
            {twoFactorEnabled ? (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={disableTwoFactor}
                disabled={twoFactorBusy}
              >
                Disable 2FA
              </button>
            ) : (
              <button
                className="btn btn-primary"
                type="button"
                onClick={enableTwoFactor}
                disabled={twoFactorBusy}
              >
                {twoFactorBusy ? (
                  <>
                    <Loader2 size={16} className="spin" /> Starting
                  </>
                ) : (
                  "Enable 2FA"
                )}
              </button>
            )}
            <Link className="btn btn-ghost" href="/auth/2fa-setup">
              Authenticator app (TOTP)
            </Link>
          </div>
        )}
      </div>

      <div className="app-card">
        <h3 className="settings-block-title">
          <Smartphone size={18} /> This device
        </h3>
        <div className="settings-row">
          <div className="settings-row-text">
            <p className="settings-row-title">
              Remember my email on this device
            </p>
            <p className="settings-row-sub">
              Pre-fill your email on the sign-in screen and stay signed in
              longer on this browser.
            </p>
          </div>
          <Switch
            checked={rememberDevice}
            onChange={toggleRememberDevice}
            label="Remember this device"
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
 * Notifications (local preferences)
 * ───────────────────────────────────────────────────────── */
function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPrefs(readNotificationPrefs());
  }, []);

  function update(key: string, value: boolean) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(NOTIFICATION_PREF_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const options: { key: string; title: string; sub: string; icon: React.ReactNode }[] = [
    {
      key: "productUpdates",
      title: "Product updates",
      sub: "New features and improvements to LocalOnline.",
      icon: <SettingsIcon size={18} />,
    },
    {
      key: "marketing",
      title: "Tips & promotions",
      sub: "Occasional offers and growth tips for your listings.",
      icon: <Mail size={18} />,
    },
    {
      key: "securityAlerts",
      title: "Security alerts",
      sub: "Sign-in activity and critical account changes.",
      icon: <ShieldCheck size={18} />,
    },
  ];

  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>Notifications</h2>
        <p>Choose what LocalOnline emails you about.</p>
      </header>

      <div className="app-card">
        {options.map((opt) => (
          <div className="settings-row" key={opt.key}>
            <div className="settings-row-text">
              <p className="settings-row-title">{opt.title}</p>
              <p className="settings-row-sub">{opt.sub}</p>
            </div>
            <Switch
              checked={Boolean(prefs[opt.key])}
              onChange={(v) => update(opt.key, v)}
              label={opt.title}
            />
          </div>
        ))}
        <p className="settings-note is-info">
          Notification preferences are stored on this device and apply to your
          signed-in account.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
 * Plan & Billing
 * ───────────────────────────────────────────────────────── */
function BillingSection() {
  const [subscription, setSubscription] = useState<SubscriptionState | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const response = await apiFetch("/api/subscriptions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setSubscription((await response.json()) as SubscriptionState);
        }
      } catch {
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const planName = subscription?.planName || "Free";
  const status = subscription?.status || "Free";

  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>Plan &amp; Billing</h2>
        <p>Review your current plan and unlock more with a paid subscription.</p>
      </header>

      <div className="app-card">
        <div className="billing-summary">
          <div>
            <p className="billing-plan-label">Current plan</p>
            <p className="billing-plan-name">{planName}</p>
          </div>
          <span className={`status-pill ${status === "Free" ? "is-off" : "is-on"}`}>
            {status}
          </span>
        </div>
        {loading ? (
          <p className="settings-row-sub">Loading plan details...</p>
        ) : (
          <p className="settings-row-sub">
            You are on the <strong>{planName}</strong> plan. Upgrade to promote
            your business, feature listings, and reach more customers.
          </p>
        )}
        <div className="settings-form-actions">
          <Link className="btn btn-primary" href="/promote-your-business">
            {planName === "Free" ? "Upgrade plan" : "Manage plan"}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
 * Role-specific sections
 * ───────────────────────────────────────────────────────── */
function BusinessSection() {
  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>My Business</h2>
        <p>Manage the listings and storefront tied to your owner account.</p>
      </header>
      <div className="settings-card-grid">
        <LinkCard
          href="/owner/listing"
          icon={<Building2 size={18} />}
          title="Owner Listing"
          sub="Add, edit, and manage your business listings."
        />
        <LinkCard
          href="/claims"
          icon={<ClipboardCheck size={18} />}
          title="Claims"
          sub="Review and manage your listing claims and requests."
        />
      </div>
    </section>
  );
}

function AdminSection() {
  const links = [
    { href: "/dashboard", title: "Admin Dashboard", sub: "Platform overview and key metrics." },
    { href: "/admin/users", title: "Users", sub: "Search and manage member accounts." },
    { href: "/admin/roles", title: "Roles", sub: "Assign roles and permissions." },
    { href: "/admin/analytics", title: "Analytics", sub: "Traffic and engagement reports." },
    { href: "/admin/subscriptions", title: "Subscriptions", sub: "Plans, billing, and renewals." },
    { href: "/admin/moderation", title: "Moderation", sub: "Review and approve content." },
  ];
  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>Admin Console</h2>
        <p>Quick access to the administrative tools for this workspace.</p>
      </header>
      <div className="settings-card-grid">
        {links.map((l) => (
          <LinkCard
            key={l.href}
            href={l.href}
            icon={<UserCog size={18} />}
            title={l.title}
            sub={l.sub}
          />
        ))}
      </div>
    </section>
  );
}

function PlatformSection() {
  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>Platform Settings</h2>
        <p>Global configuration for the LocalOnline platform.</p>
      </header>
      <LinkCard
        href="/superadmin/settings"
        icon={<SettingsIcon size={18} />}
        title="App & SMTP Settings"
        sub="Site name, support contacts, and email (SMTP) configuration."
      />
      <LinkCard
        href="/superadmin/users"
        icon={<UserIcon size={18} />}
        title="User Management"
        sub="Browse and manage all platform users."
      />
      <LinkCard
        href="/superadmin/roles"
        icon={<ShieldCheck size={18} />}
        title="Role Management"
        sub="Control roles and access across the platform."
      />
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
 * Account / Danger zone
 * ───────────────────────────────────────────────────────── */
function AccountSection({
  email,
  roleLabel,
  onNavigate,
}: {
  email?: string | null;
  roleLabel: string;
  onNavigate: (id: SectionId) => void;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    clearAuthTokenCookie();
    window.location.href = "/";
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (confirmText !== "DELETE") {
      setError('Type "DELETE" to confirm account removal.');
      return;
    }
    setBusy(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await apiFetch("/api/user/account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!response.ok) throw new Error(await response.text());
      clearAuthTokenCookie();
      window.location.href = "/";
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete account."));
      setBusy(false);
    }
  }

  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>Account</h2>
        <p>Session and account management for {email ?? "this account"}.</p>
      </header>

      <div className="app-card">
        <h3 className="settings-block-title">
          <KeyRound size={18} /> Session
        </h3>
        <div className="settings-row">
          <div className="settings-row-text">
            <p className="settings-row-title">Role</p>
            <p className="settings-row-sub">
              Your access level on this workspace.
            </p>
          </div>
          <span className={`role-badge role-${roleLabel.toLowerCase()}`}>
            {roleLabel}
          </span>
        </div>
        <div className="settings-form-actions">
          <button className="btn btn-ghost" type="button" onClick={logout}>
            <LogOut size={16} /> Log out
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => onNavigate("security")}
          >
            Security settings
          </button>
        </div>
      </div>

      <div className="app-card danger-zone">
        <h3 className="settings-block-title danger-title">
          <AlertTriangle size={18} /> Danger Zone
        </h3>
        <p className="settings-row-sub">
          Deleting your account is permanent and removes your profile, listings
          access, and sign-in credentials. This cannot be undone.
        </p>

        {!deleteOpen ? (
          <div className="settings-form-actions">
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={16} /> Delete account
            </button>
          </div>
        ) : (
          <form onSubmit={deleteAccount} className="settings-inline-form">
            <FormMessage message={error} tone="error" />
            <PasswordField
              id="delete-password"
              label="Confirm your password"
              value={deletePassword}
              onChange={setDeletePassword}
              required
              autoComplete="current-password"
              hasError={Boolean(error)}
            />
            <FormField label='Type "DELETE" to confirm'>
              <input
                className="form-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </FormField>
            <div className="settings-form-actions">
              <button
                className="btn btn-danger"
                type="submit"
                disabled={busy}
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="spin" /> Deleting
                  </>
                ) : (
                  "Permanently delete"
                )}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword("");
                  setConfirmText("");
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="settings-footnote">
        Need help? Contact{" "}
        <a href="mailto:support@localonline.in">support@localonline.in</a>.
      </p>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
 * Small shared UI helpers
 * ───────────────────────────────────────────────────────── */
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="switch" title={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="slider" />
    </label>
  );
}

function LinkCard({
  href,
  icon,
  title,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Link href={href} className="settings-link-card">
      <span className="settings-link-icon">{icon}</span>
      <span className="settings-link-text">
        <span className="settings-link-title">{title}</span>
        <span className="settings-link-sub">{sub}</span>
      </span>
      <ChevronRight size={18} className="settings-link-chevron" />
    </Link>
  );
}
