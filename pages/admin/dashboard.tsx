import { useEffect } from "react";
import { useRouter } from "next/router";
import { useRequireAuth } from "../../lib/auth";

export default function AdminDashboardRedirect() {
  const router = useRouter();
  const { isChecking, isAuthenticated } = useRequireAuth();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isChecking, isAuthenticated, router]);

  return <div className="app-loading">Loading dashboard...</div>;
}
