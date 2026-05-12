import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/apiClient";
import ServiceCard from "./ServiceCard";
import styles from "./MonetizationDashboard.module.css";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
}

export const MonetizationDashboard: React.FC<{ cid?: string }> = ({ cid }) => {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/services");
      setServices(response.data);
    } catch (err) {
      setError("Failed to load services. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = async (serviceId: string) => {
    try {
      if (serviceId === "featured-listing") {
        // Navigate to featured listing purchase page
        router.push({
          pathname: "/monetization/featured-listing",
          query: { cid },
        });
      } else if (serviceId === "whatsapp-ads") {
        // Navigate to WhatsApp campaign creation page
        router.push({
          pathname: "/monetization/whatsapp-ads",
          query: { cid },
        });
      } else if (serviceId === "ad-management") {
        // Navigate to ad management request page
        router.push({
          pathname: "/monetization/ad-management",
          query: { cid },
        });
      } else if (serviceId === "banner-ads") {
        // Navigate to banner ads purchase page
        router.push({
          pathname: "/monetization/banner-ads",
          query: { cid },
        });
      }
    } catch (err) {
      console.error("Error navigating to service:", err);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading services...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2>Grow Your Business with Localonline</h2>
        <p>Choose the right promotional service to reach more customers</p>
      </div>

      <div className={styles.servicesGrid}>
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            {...service}
            onSelect={handleSelectService}
          />
        ))}
      </div>

      <div className={styles.testimonials}>
        <h3>Why Businesses Choose LocalOnline</h3>
        <div className={styles.testimonialGrid}>
          <div className={styles.testimonial}>
            <div className={styles.rating}>★★★★★</div>
            <p>"Featured listing brought 3x more customers to my café!"</p>
            <span className={styles.author}>- Rahul, Cafe Owner</span>
          </div>
          <div className={styles.testimonial}>
            <div className={styles.rating}>★★★★★</div>
            <p>"WhatsApp ads reach locals directly. Amazing ROI!"</p>
            <span className={styles.author}>- Priya, Tuition Center</span>
          </div>
          <div className={styles.testimonial}>
            <div className={styles.rating}>★★★★★</div>
            <p>"Ad management team is professional and delivers results."</p>
            <span className={styles.author}>- Amit, Interior Designer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonetizationDashboard;
