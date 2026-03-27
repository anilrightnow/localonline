import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token") ?? localStorage.getItem("accessToken");
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

    const controller = new AbortController();
    const verify = async () => {
      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("unauthorized");
        setIsAuthenticated(true);
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
        }
        const returnUrl = encodeURIComponent(router.asPath || "/");
        void router.replace(`/auth/login?returnUrl=${returnUrl}`);
        return;
      } finally {
        setIsChecking(false);
      }
    };
    void verify();
    return () => controller.abort();
  }, [router]);

  return { isChecking, isAuthenticated, token: getAuthToken() };
}
