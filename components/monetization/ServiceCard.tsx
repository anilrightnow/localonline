import React from "react";
import styles from "./ServiceCard.module.css";

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  onSelect: (serviceId: string) => void;
  isLoading?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  name,
  description,
  price,
  currency,
  billingCycle,
  features,
  onSelect,
  isLoading = false,
}) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{name}</h3>
      <p className={styles.description}>{description}</p>

      <div className={styles.pricing}>
        <span className={styles.price}>₹{price}</span>
        <span className={styles.cycle}>/{billingCycle}</span>
      </div>

      <ul className={styles.features}>
        {features.map((feature, idx) => (
          <li key={idx} className={styles.feature}>
            <span className={styles.check}>✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        className={styles.selectBtn}
        onClick={() => onSelect(id)}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Choose Plan"}
      </button>
    </div>
  );
};

export default ServiceCard;
