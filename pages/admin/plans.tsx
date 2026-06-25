import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/app/AppShell";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { apiUrl, apiFetch } from "../../lib/apiClient";
import { getUserSessionFromToken, hasRole } from "../../lib/session";
import { getApiErrorMessage } from "../../lib/apiError";
import FormMessage from "../../components/shared/FormMessage";
import axios from "axios";

interface Plan {
  id: string;
  name: string;
  price: number;
  discountAnnually: number;
  discountQuarterly: number;
  isActive: boolean;
  features: PlanFeature[];
}

interface PlanFeature {
  id: string;
  feature: string;
  isActive: boolean;
}

export default function AdminPlansPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const session = useMemo(() => getUserSessionFromToken(getAuthToken()), []);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating/editing plans
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState(0);
  const [discountAnnually, setDiscountAnnually] = useState(0);
  const [discountQuarterly, setDiscountQuarterly] = useState(0);

  // Form state for adding features
  const [newFeature, setNewFeature] = useState("");
  const [selectedPlanForFeature, setSelectedPlanForFeature] = useState<
    string | null
  >(null);

  const isSuperAdmin = hasRole(session, "SuperAdmin");

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await axios.get(apiUrl("/api/admin/plans/all"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      fetchPlans();
    }
  }, [isAuthenticated, isSuperAdmin]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    const method = editingPlan?.id ? "PUT" : "POST";
    const url = editingPlan?.id
      ? `/api/admin/plans/${editingPlan.id}`
      : "/api/admin/plans";

    try {
      await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: planName,
          price: planPrice,
          discountAnnually,
          discountQuarterly,
        }),
      });
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForFeature || !newFeature) return;
    const token = getAuthToken();
    try {
      await apiFetch(`/api/admin/plans/${selectedPlanForFeature}/features`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feature: newFeature }),
      });
      setNewFeature("");
      fetchPlans();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm("Are you sure you want to delete this feature?")) return;
    const token = getAuthToken();
    try {
      await apiFetch(`/api/admin/plans/features/${featureId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPlans();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!isSuperAdmin && !isChecking) {
    return (
      <AppShell title="Access Denied" requiredRole="SuperAdmin">
        <p>You do not have permission to view this page.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Manage Plans"
      requiredRole="SuperAdmin"
      subtitle="Create, edit, and manage subscription plans and features."
    >
      {error && <FormMessage tone="error" message={error} />}

      <div className="app-card">
        <h2>Plans</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingPlan({});
            setPlanName("");
            setPlanPrice(0);
            setDiscountAnnually(0);
            setDiscountQuarterly(0);
          }}
        >
          Create New Plan
        </button>
        {loading && <p>Loading plans...</p>}
        <div className="app-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="app-card">
              <h3>
                {plan.name} - ${plan.price}/mo
              </h3>
              <p>
                Quarterly Discount: {plan.discountQuarterly}% | Annual Discount:{" "}
                {plan.discountAnnually}%
              </p>
              <h4>Features:</h4>
              <ul>
                {plan.features.map((f) => (
                  <li key={f.id}>
                    {f.feature}{" "}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteFeature(f.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditingPlan(plan);
                  setPlanName(plan.name);
                  setPlanPrice(plan.price);
                  setDiscountAnnually(plan.discountAnnually);
                  setDiscountQuarterly(plan.discountQuarterly);
                }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      {editingPlan && (
        <div className="app-card">
          <h2>{editingPlan.id ? "Edit Plan" : "Create Plan"}</h2>
          <form onSubmit={handleSavePlan}>
            <div className="form-row">
              <label>Name</label>
              <input
                className="form-input"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label>Price (Monthly)</label>
              <input
                type="number"
                className="form-input"
                value={planPrice}
                onChange={(e) => setPlanPrice(parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="form-row">
              <label>Discount Quarterly (%)</label>
              <input
                type="number"
                className="form-input"
                value={discountQuarterly}
                onChange={(e) =>
                  setDiscountQuarterly(parseFloat(e.target.value))
                }
              />
            </div>
            <div className="form-row">
              <label>Discount Annually (%)</label>
              <input
                type="number"
                className="form-input"
                value={discountAnnually}
                onChange={(e) =>
                  setDiscountAnnually(parseFloat(e.target.value))
                }
              />
            </div>
            <div className="app-actions">
              <button type="submit" className="btn btn-primary">
                Save Plan
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditingPlan(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="app-card">
        <h2>Add Feature to Plan</h2>
        <form onSubmit={handleAddFeature}>
          <div className="form-row">
            <label>Plan</label>
            <select
              className="form-select"
              onChange={(e) => setSelectedPlanForFeature(e.target.value)}
              value={selectedPlanForFeature ?? ""}
            >
              <option value="" disabled>
                Select a plan
              </option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Feature Name</label>
            <input
              className="form-input"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              required
            />
          </div>
          <div className="app-actions">
            <button type="submit" className="btn btn-primary">
              Add Feature
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
