import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "./apiClient";
import { getAuthTokenFromCookieHeader } from "./authCookie";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return getAuthTokenFromCookieHeader(document.cookie);
}

export function getAuthHeader(): { Authorization?: string } {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function setAuthTokenCookie(token: string) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(token);
  const base = "path=/; SameSite=Lax";
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `access_token=${value}; Max-Age=1800; ${base}${secure}`;
  document.cookie = `token=${value}; Max-Age=1800; ${base}${secure}`;
}

export function clearAuthTokenCookie() {
  if (typeof document === "undefined") return;
  const base = "path=/; SameSite=Lax";
  document.cookie = `access_token=; Max-Age=0; ${base}`;
  document.cookie = `token=; Max-Age=0; ${base}`;
}

export function useRequireAuth() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      const returnUrl = encodeURIComponent(router.asPath || "/");
      void router.replace(`/auth/login?returnUrl=${returnUrl}`);
      return;
    }
    setIsAuthenticated(true);
    setIsChecking(false);
  }, [router]);

  return { isChecking, isAuthenticated, token: getAuthToken() };
}
