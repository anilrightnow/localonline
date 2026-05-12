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

/**
 * Standard API client wrapper for fetch operations.
 */
export const apiClient = {
  get: async <T = any>(path: string, init?: RequestInit) => {
    const response = await apiFetch(path, { ...init, method: "GET" });
    const data = await response.json();
    return { data: data as T, response };
  },
    
  post: async <T = any>(path: string, data: any, init?: RequestInit) => {
    const response = await apiFetch(path, {
      ...init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { data: result as T, response };
  },
};
