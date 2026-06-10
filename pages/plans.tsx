import React, { useEffect, useState } from "react";
import axios from "axios";
import { getApiErrorMessage } from "../lib/apiError";
import { getAuthToken, useRequireAuth } from "../lib/auth";
import AppShell from "../components/app/AppShell";
import { apiUrl } from "../lib/apiClient";
import FormMessage from "../components/shared/FormMessage";

interface Plan {
  name: string;
  price: number;
  monthlyLimitRows: number;
}

const PlansPage = () => {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPlans();
    fetchCurrentSubscription();
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await axios.get(apiUrl("/api/plans"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(response.data);
    } catch (error) {}
  };

  const fetchCurrentSubscription = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await axios.get(apiUrl("/api/subscriptions"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.planName) {
        setCurrentPlan(response.data.planName);
      }
    } catch (error) {}
  };

  const handleUpgrade = async (planName: string) => {
    setLoading(true);
    setMessage("");
    try {
      const token = getAuthToken();
      if (!token) {
        setMessage("Please sign in to upgrade your plan.");
        return;
      }
      await axios.post(
        apiUrl("/api/plans/upgrade"),
        { planName },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("Plan upgraded successfully!");
      setCurrentPlan(planName);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to upgrade plan."));
    }
    setLoading(false);
  };

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  return (
    <AppShell title="Plans & Billing" subtitle="Choose the plan that fits your monthly usage.">
      {message ? <FormMessage message={message} tone="success" /> : null}
      <div className="app-card">
        <h2>Upgrade Steps</h2>
        <ol>
          <li>Review plan limits and paid feature access.</li>
          <li>Select your target plan and click Upgrade.</li>
          <li>Re-open Owner Listing or Events pages to use unlocked features.</li>
        </ol>
      </div>
      <div className="app-grid">
        {plans.map((plan) => (
          <article key={plan.name} className="app-card">
            <h3>{plan.name}</h3>
            <p><strong>${plan.price}</strong> / month</p>
            <p>{plan.monthlyLimitRows.toLocaleString()} rows per month</p>
            {currentPlan === plan.name ? (
              <button className="btn btn-ghost" disabled>Current Plan</button>
            ) : (
              <button className="btn btn-primary" onClick={() => handleUpgrade(plan.name)} disabled={loading}>
                Upgrade
              </button>
            )}
          </article>
        ))}
      </div>
      <style jsx>{`
        .app-card h3 {
          margin-top: 0;
        }
      `}</style>
    </AppShell>
  );
};

export default PlansPage;
