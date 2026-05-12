import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/AdminLayout";
import styles from "./success.module.css";

export default function SuccessPage() {
  const router = useRouter();
  const { paymentId, serviceType, cid } = router.query;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      router.push({
        pathname: "/dashboard",
        query: { tab: "monetization" },
      });
    }
  }, [countdown, router]);

  const getServiceName = () => {
    switch (serviceType) {
      case "featured-listing":
        return "Featured Listing";
      case "whatsapp-ads":
        return "WhatsApp Campaign";
      case "ad-management":
        return "Ad Management Service";
      case "banner-ads":
        return "Banner Ad";
      default:
        return "Service";
    }
  };

  return (
    <AdminLayout title="Payment Successful">
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.checkmark}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
              <path d="M22 4L12 14.01l-3-3"></path>
            </svg>
          </div>

          <h1>Payment Successful!</h1>
          <p className={styles.subtitle}>Thank you for your purchase</p>

          <div className={styles.details}>
            <div className={styles.detail}>
              <span className={styles.label}>Service:</span>
              <span className={styles.value}>{getServiceName()}</span>
            </div>
            <div className={styles.detail}>
              <span className={styles.label}>Payment ID:</span>
              <span className={styles.value}>{paymentId}</span>
            </div>
            {cid && (
              <div className={styles.detail}>
                <span className={styles.label}>Business:</span>
                <span className={styles.value}>{cid}</span>
              </div>
            )}
          </div>

          <div className={styles.message}>
            <p>✓ Your subscription is now active</p>
            <p>✓ You'll receive a confirmation email shortly</p>
            <p>✓ Check your dashboard to see the updates</p>
          </div>

          <div className={styles.actions}>
            <Link href="/dashboard">
              <a className={styles.primaryBtn}>Go to Dashboard</a>
            </Link>
            <Link href="/">
              <a className={styles.secondaryBtn}>Back to Home</a>
            </Link>
          </div>

          <div className={styles.redirect}>
            <p>Redirecting to dashboard in {countdown} seconds...</p>
          </div>
        </div>

        <div className={styles.nextSteps}>
          <h2>What's Next?</h2>
          <ul>
            <li>
              <strong>Featured Listing:</strong> Your business will appear at
              the top of relevant search results
            </li>
            <li>
              <strong>WhatsApp Campaign:</strong> Your message will be sent to
              500+ local residents within 24 hours
            </li>
            <li>
              <strong>Ad Management:</strong> Our team will contact you to set
              up your campaigns
            </li>
            <li>
              <strong>Banner Ads:</strong> Your ad will be featured on our
              homepage
            </li>
          </ul>
        </div>

        <div className={styles.support}>
          <h3>Need Help?</h3>
          <p>
            If you have any questions about your subscription, please{" "}
            <a href="mailto:support@localonline.in">contact our support team</a>
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
