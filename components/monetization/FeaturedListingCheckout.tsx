import React, { useState } from "react";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/apiClient";
import RazorpayPaymentButton from "@/components/monetization/RazorpayPaymentButton";
import styles from "./FeaturedListingCheckout.module.css";

export const FeaturedListingCheckout: React.FC = () => {
  const router = useRouter();
  const { cid } = router.query;
  const [durationMonths, setDurationMonths] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const totalPrice = 500 * durationMonths;

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      setSuccess(true);
      // Redirect to success page or dashboard
      setTimeout(() => {
        router.push({
          pathname: "/monetization/success",
          query: { paymentId, serviceType: "featured-listing", cid },
        });
      }, 2000);
    } catch (err) {
      setError(
        "Payment confirmed but failed to process. Please contact support.",
      );
    }
  };

  const handlePaymentError = (error: Error) => {
    setError(`Payment failed: ${error.message}`);
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <div className={styles.checkmark}>✓</div>
          <h2>Payment Successful!</h2>
          <p>Your featured listing is now active. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Upgrade to Featured Listing</h2>
        <p className={styles.subtitle}>
          Get more visibility and attract local customers
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.benefits}>
          <h3>Benefits:</h3>
          <ul>
            <li>✓ Top placement in search results</li>
            <li>✓ Blue verification badge</li>
            <li>✓ Highlighted in category listings</li>
            <li>✓ Priority customer support</li>
          </ul>
        </div>

        <div className={styles.pricingSection}>
          <label htmlFor="duration">Duration:</label>
          <select
            id="duration"
            value={durationMonths}
            onChange={(e) => setDurationMonths(parseInt(e.target.value))}
            className={styles.select}
          >
            <option value={1}>1 Month - ₹500</option>
            <option value={3}>3 Months - ₹1,500</option>
            <option value={6}>6 Months - ₹3,000</option>
            <option value={12}>12 Months - ₹6,000</option>
          </select>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Base Price:</span>
              <span>₹500/month</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Duration:</span>
              <span>
                {durationMonths} month{durationMonths > 1 ? "s" : ""}
              </span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total:</span>
              <span>₹{totalPrice}</span>
            </div>
          </div>
        </div>

        <RazorpayPaymentButton
          serviceType="featured-listing"
          amount={totalPrice}
          cid={String(cid || "")}
          description={`Featured listing for ${durationMonths} month(s)`}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />

        <div className={styles.footer}>
          <p>🔒 Secure payment powered by Razorpay</p>
          <button className={styles.backBtn} onClick={() => router.back()}>
            ← Back
          </button>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h3>How Featured Listings Work</h3>
        <p>
          Your business will be featured at the top of relevant search results
          for the selected duration. This increases visibility and attracts more
          local customers looking for your services.
        </p>
      </div>
    </div>
  );
};

export default FeaturedListingCheckout;
