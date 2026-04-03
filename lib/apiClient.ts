import { getApiBaseUrl } from "./publicApi";
import { getAuthToken } from "./auth";

export function apiUrl(path: string): string {
  if (!path) return getApiBaseUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getApiBaseUrl();
  if (path.startsWith("/")) {
    if (typeof window !== "undefined") {
      const token = getAuthToken();
      if (!token && !path.startsWith("/api/auth/")) {
        return `/api/proxy${path}`;
      }
    }
    return `${base}${path}`;
  }
  return `${base}/${path}`;
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), init);
}
