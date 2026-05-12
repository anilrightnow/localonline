import React from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/AdminLayout";
import MonetizationDashboard from "@/components/monetization/MonetizationDashboard";

export default function MonetizationPage() {
  const router = useRouter();
  const { cid } = router.query;

  return (
    <AdminLayout title="Business Monetization">
      <div style={{ padding: "20px" }}>
        <MonetizationDashboard cid={String(cid || "")} />
      </div>
    </AdminLayout>
  );
}
