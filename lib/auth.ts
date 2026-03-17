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

    setIsAuthenticated(true);
    setIsChecking(false);
  }, [router]);

  return { isChecking, isAuthenticated, token: getAuthToken() };
}
