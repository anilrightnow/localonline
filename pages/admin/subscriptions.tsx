import React, { useState, useEffect } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { getApiBaseUrl } from "../../lib/publicApi";
import FormMessage from "../../components/shared/FormMessage";

interface Subscription {
  id: string;
  status: string;
  planName: string;
  monthlyUsedRows: number;
  monthlyLimitRows: number;
  monthlyPrice: number;
  subscribedAt: string;
  renewsAt: string;
}

interface Plan {
  id: string;
  name: string;
  monthlyLimitRows: number;
  price: number;
}

export default function Subscriptions() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSubscription();
    fetchPlans();
  }, [isAuthenticated]);

  const fetchSubscription = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await fetch(`${apiBaseUrl}/api/subscriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to load subscription");
      const json = await response.json();
      setSubscription(json);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load subscription."));
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await fetch(`${apiBaseUrl}/api/plans/plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const json = await response.json();
        setPlans(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  const handleChangePlan = async (planId: string) => {
    setMessage(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated.");
      const response = await fetch(`${apiBaseUrl}/api/subscriptions/change-plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });
      if (!response.ok) throw new Error("Failed to change plan");
      setMessage("Plan changed successfully.");
      fetchSubscription();
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Failed to change plan."));
    }
  };

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }
  if (loading) return <div className="app-loading">Loading subscriptions...</div>;
  if (error) {
    return (
      <AppShell requiredRole="Admin" title="Subscriptions">
        <FormMessage message={error} tone="error" />
      </AppShell>
    );
  }

  const usagePercent = subscription
    ? Math.round(
        (subscription.monthlyUsedRows / subscription.monthlyLimitRows) * 100
      )
    : 0;

  return (
    <AppShell requiredRole="Admin" title="Subscription Management" subtitle="Monitor usage and switch plans for the current account.">
      {message ? <FormMessage message={message} tone="success" /> : null}

      {subscription && (
        <div className="app-card">
          <div className="app-grid">
            <div>
              <h2>Current Plan</h2>
              <p><strong>Plan:</strong> {subscription.planName}</p>
              <p><strong>Status:</strong> <span className="capitalize">{subscription.status}</span></p>
              <p><strong>Price:</strong> ${subscription.monthlyPrice}/month</p>
              <p><strong>Renews:</strong> {new Date(subscription.renewsAt).toLocaleDateString()}</p>
            </div>

            <div>
              <h2>Usage</h2>
              <p><strong>Monthly Usage:</strong> {subscription.monthlyUsedRows} / {subscription.monthlyLimitRows} rows</p>
              <div style={{ width: "100%", background: "#e8eef2", borderRadius: 999, height: 12 }}>
                <div
                  style={{ width: `${Math.min(usagePercent, 100)}%`, borderRadius: 999, height: 12, background: usagePercent > 80 ? "#be123c" : "#0f766e" }}
                />
              </div>
              <p>{usagePercent}% used</p>
            </div>
          </div>
        </div>
      )}

      <div className="app-card">
        <h2>Available Plans</h2>
        <div className="app-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="app-card">
              <h3>{plan.name}</h3>
              <p><strong>${plan.price}</strong></p>
              <p>{plan.monthlyLimitRows.toLocaleString()} rows/month</p>
              <button
                onClick={() => handleChangePlan(plan.id)}
                disabled={subscription?.planName === plan.name}
                className={`btn ${subscription?.planName === plan.name ? "btn-ghost" : "btn-primary"}`}
              >
                {subscription?.planName === plan.name
                  ? "Current Plan"
                  : "Choose Plan"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
