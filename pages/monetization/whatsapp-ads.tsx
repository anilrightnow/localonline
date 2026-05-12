import React, { useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/AdminLayout";
import { apiClient } from "@/lib/apiClient";
import { useRequireAuth } from "@/lib/auth";
import { getUserSessionFromToken } from "@/lib/session";
import RazorpayPaymentButton from "@/components/monetization/RazorpayPaymentButton";
import styles from "./whatsapp-ads.module.css";
import {
  LayoutDashboard,
  DollarSign,
  List,
  MessageSquare,
  Settings,
} from "lucide-react";

// Define navigation items for the admin layout
const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Monetization", href: "/admin/monetization", icon: DollarSign },
  { label: "Listings", href: "/admin/listings", icon: List },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function WhatsAppAdsPage() {
  const router = useRouter();
  const { cid } = router.query;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [targetGroups, setTargetGroups] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const { isAuthenticated, isChecking, token } = useRequireAuth();

  if (isChecking) {
    // Render a loading state while authentication is being checked
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    // The useRequireAuth hook handles redirection if not authenticated,
    // so we can return null here or a minimal message.
    return null;
  }

  const session = getUserSessionFromToken(token);
  const userRole = session.roles.length > 0 ? session.roles[0] : "User"; // Use the first role found
  const userName = session.email || "Unknown User"; // Fallback if email is not available

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !message) {
      setError("Title and message are required");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post(
        "/api/services/whatsapp-ads/campaign",
        {
          cid,
          title,
          message,
          targetGroups,
          mediaUrl,
        },
      );

      setCampaignId(response.data.campaignId);
      setPaymentId(response.data.paymentId);
    } catch (err) {
      setError("Failed to create campaign. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      router.push({
        pathname: "/monetization/success",
        query: { paymentId, serviceType: "whatsapp-ads", cid },
      });
    } catch (err) {
      setError(
        "Payment confirmed but failed to process. Please contact support.",
      );
    }
  };

  const handlePaymentError = (error: Error) => {
    setError(`Payment failed: ${error.message}`);
  };

  if (campaignId && paymentId) {
    return (
      <AdminLayout
        title="WhatsApp Campaign - Payment"
        userRole={userRole}
        userName={userName}
        navItems={adminNavItems}
      >
        <div className={styles.container}>
          <div className={styles.card}>
            <h2>Complete Your WhatsApp Campaign</h2>
            <p className={styles.subtitle}>
              Campaign created successfully. Complete payment to activate.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.campaignPreview}>
              <h3>Campaign Preview:</h3>
              <div className={styles.preview}>
                <p>
                  <strong>Title:</strong> {title}
                </p>
                <p>
                  <strong>Message:</strong> {message}
                </p>
                {mediaUrl && (
                  <p>
                    <strong>Has Media:</strong> Yes
                  </p>
                )}
                <p>
                  <strong>Target Groups:</strong>{" "}
                  {targetGroups || "All residents"}
                </p>
              </div>
            </div>

            <div className={styles.pricing}>
              <p className={styles.priceLabel}>Campaign Cost:</p>
              <p className={styles.price}>₹1,000</p>
            </div>

            <RazorpayPaymentButton
              serviceType="whatsapp-ads"
              amount={1000}
              serviceId={campaignId}
              cid={String(cid || "")}
              description={`WhatsApp campaign: ${title}`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />

            <button
              className={styles.backBtn}
              onClick={() => {
                setCampaignId(null);
                setPaymentId(null);
              }}
            >
              ← Edit Campaign
            </button>
          </div>

          <div className={styles.infoBox}>
            <h3>How WhatsApp Campaigns Work</h3>
            <ul>
              <li>Reach 500+ local residents directly</li>
              <li>Send promotional messages with media</li>
              <li>Target specific groups or send to all</li>
              <li>Track delivery and engagement</li>
            </ul>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Create WhatsApp Campaign"
      userRole={userRole}
      userName={userName}
      navItems={adminNavItems}
    >
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Create WhatsApp Campaign</h2>
          <p className={styles.subtitle}>
            Send promotional messages to local customers
          </p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleCreateCampaign} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Campaign Title *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Sale 50% Off"
                maxLength={100}
              />
              <span className={styles.charCount}>{title.length}/100</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your promotional message..."
                rows={5}
                maxLength={500}
              />
              <span className={styles.charCount}>{message.length}/500</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="targetGroups">Target Groups (optional)</label>
              <input
                id="targetGroups"
                type="text"
                value={targetGroups}
                onChange={(e) => setTargetGroups(e.target.value)}
                placeholder="e.g., Gaur City 7th Avenue, Crossing Republik"
              />
              <p className={styles.hint}>
                Leave empty to send to all residents
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="mediaUrl">Media URL (optional)</label>
              <input
                id="mediaUrl"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className={styles.hint}>JPG, PNG, or GIF. Max 5MB</p>
            </div>

            <div className={styles.benefits}>
              <h3>Campaign Benefits:</h3>
              <ul>
                <li>✓ Reach 500+ local residents</li>
                <li>✓ Direct WhatsApp delivery</li>
                <li>✓ Include images or media</li>
                <li>✓ Track message delivery</li>
              </ul>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !title || !message}
            >
              {loading ? "Creating..." : "Create Campaign (₹1,000)"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
