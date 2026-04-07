import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppShell from "../components/app/AppShell";
import { getApiErrorMessage } from "../lib/apiError";
import { getAuthToken, useRequireAuth } from "../lib/auth";
import { apiFetch } from "../lib/apiClient";
import PasswordField from "../components/shared/PasswordField";
import FormField from "../components/shared/FormField";
import FormMessage from "../components/shared/FormMessage";

type ProfileSection = "overview" | "edit-profile" | "change-password";

interface UserProfile {
  id: string;
  userName?: string | null;
  email?: string | null;
  fullName?: string | null;
  mobile?: string | null;
  dob?: string | null;
  gender?: string | null;
}

interface SubscriptionState {
  planName: string;
  status: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isChecking, isAuthenticated } = useRequireAuth();
  const initialSection = useMemo<ProfileSection>(() => {
    const tab = typeof router.query.section === "string" ? router.query.section : "";
    if (tab === "edit-profile" || tab === "change-password") return tab;
    return "overview";
  }, [router.query.section]);

  const [section, setSection] = useState<ProfileSection>(initialSection);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchProfile();
    void fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function fetchProfile() {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated.");
      }
      const response = await apiFetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
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
  }

  async function fetchSubscription() {
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }
      const response = await apiFetch("/api/subscriptions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        return;
      }
      const json = (await response.json()) as SubscriptionState;
      setSubscription(json);
    } catch {
      setSubscription(null);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated.");
      }
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
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setSuccess("Profile updated successfully.");
      void fetchProfile();
      setSection("overview");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update profile."));
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated.");
      }
      const response = await apiFetch("/api/user/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setSection("overview");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to change password."));
    }
  }

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }
  if (loading) return <div className="app-loading">Loading profile...</div>;

  return (
    <AppShell title="My Profile" subtitle="Manage account information, security, and plan upgrades.">
      <FormMessage message={error} tone="error" />
      <FormMessage message={success} tone="success" />

      <div className="app-grid">
        <div className="app-card">
          <h2>Account Summary</h2>
          <p><strong>Name:</strong> {profile?.fullName || "-"}</p>
          <p><strong>Username:</strong> {profile?.userName || "-"}</p>
          <p><strong>Email:</strong> {profile?.email || "-"}</p>
          <p><strong>Mobile:</strong> {profile?.mobile || "-"}</p>
          <p><strong>DOB:</strong> {profile?.dob ? new Date(profile.dob).toLocaleDateString() : "-"}</p>
          <p><strong>Gender:</strong> {profile?.gender || "-"}</p>
          <p><strong>Current Plan:</strong> {subscription?.planName || "Free"}</p>
          <div className="app-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setSection("edit-profile")}>Update Profile</button>
            <button className="btn btn-ghost" type="button" onClick={() => setSection("change-password")}>Change Password</button>
            <Link className="btn btn-primary" href="/plans">Upgrade Plan</Link>
          </div>
        </div>

        <div className="app-card">
          <h2>Quick Links</h2>
          <p>Manage profile and password via links only, then complete action in the selected section.</p>
          <div className="app-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setSection("edit-profile")}>Open Update Profile</button>
            <button className="btn btn-ghost" type="button" onClick={() => setSection("change-password")}>Open Change Password</button>
            <Link className="btn btn-ghost" href="/plans">View Plan Details</Link>
          </div>
        </div>
      </div>

      {section === "edit-profile" ? (
        <div className="app-card">
          <h2>Update Profile</h2>
          <form onSubmit={handleUpdateProfile}>
            <FormField label="Full Name">
              <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </FormField>
            <FormField label="Username">
              <input className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </FormField>
            <FormField label="Email">
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
            <FormField label="Mobile">
              <input className="form-input" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </FormField>
            <FormField label="DOB (optional)">
              <input className="form-input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </FormField>
            <FormField label="Gender (optional)">
              <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="PreferNotToSay">Prefer not to say</option>
              </select>
            </FormField>
            <div className="app-actions">
              <button className="btn btn-primary" type="submit">Save Profile</button>
              <button className="btn btn-ghost" type="button" onClick={() => setSection("overview")}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}

      {section === "change-password" ? (
        <div className="app-card">
          <h2>Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <PasswordField
              id="profile-current-password"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              required
              autoComplete="current-password"
              hasError={Boolean(error)}
            />
            <PasswordField
              id="profile-new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              required
              minLength={6}
              autoComplete="new-password"
              showStrength
              hasError={Boolean(error)}
            />
            <div className="app-actions">
              <button className="btn btn-primary" type="submit">Update Password</button>
              <button className="btn btn-ghost" type="button" onClick={() => setSection("overview")}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
