import { useEffect } from "react";
import { useRouter } from "next/router";
import { useRequireAuth } from "../lib/auth";

export default function ProfileRedirect() {
  const router = useRouter();
  const { isChecking, isAuthenticated } = useRequireAuth();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      router.replace("/settings?section=profile");
    }
  }, [isChecking, isAuthenticated, router]);

  return <div className="app-loading">Loading profile...</div>;
}
