import axios from "axios";
import { getApiBaseUrl } from "./publicApi";
import { getAuthToken, setAuthTokenCookie, clearAuthTokenCookie } from "./auth";

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh failed");
        const data = await res.json();
        if (data.access_token) {
          setAuthTokenCookie(data.access_token);
          return data.access_token as string;
        }
        throw new Error("No access token in refresh response");
      })
      .catch((err) => {
        clearAuthTokenCookie();
        throw err;
      })
      .finally(() => {
        isRefreshing = false;
      });
  }
  return refreshPromise!;
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return axios(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
