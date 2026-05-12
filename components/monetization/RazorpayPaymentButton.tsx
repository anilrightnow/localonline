import React, { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import styles from "./RazorpayPaymentButton.module.css";

interface RazorpayPaymentButtonProps {
  serviceType: string;
  amount: number;
  serviceId?: string;
  cid?: string;
  description: string;
  onSuccess: (paymentId: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const RazorpayPaymentButton: React.FC<RazorpayPaymentButtonProps> = ({
  serviceType,
  amount,
  serviceId,
  cid,
  description,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Initiate payment
      const response = await apiClient.post("/api/payments/initiate", {
        serviceType,
        serviceId,
        cid,
        amount,
      });

      const { razorpayOrderId, paymentId } = response.data;

      // Load Razorpay SDK
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "",
          amount: amount * 100, // Convert to paise
          currency: "INR",
          name: "LocalOnline",
          description: description,
          order_id: razorpayOrderId,
          handler: async (response: any) => {
            // Payment successful
            onSuccess(paymentId);
          },
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          theme: {
            color: "#00d084",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Payment initiation failed");
      onError?.(error);
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={styles.button}
      onClick={handlePayment}
      disabled={loading || disabled}
      title={disabled ? "Payment unavailable" : "Click to proceed with payment"}
    >
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
};

export default RazorpayPaymentButton;
