import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SiteShell from "../components/public/SiteShell";
import { getApiBaseUrl } from "../lib/publicApi";
import { getApiErrorMessage } from "../lib/apiError";
import { getAuthToken } from "../lib/auth";
import {
  CheckCircle,
  Zap,
  ShieldCheck,
  Gem,
  Award,
  Star,
  Crown,
  Rocket,
  TrendingUp,
  Globe,
  BarChart3,
  Headphones,
  Mail,
} from "lucide-react";

interface DynamicPlan {
  id: string;
  name: string;
  price: number;
  priceMonthly: string;
  priceQuarterly: string;
  priceAnnual: string;
  features: string[];
  icon: string | null;
  cta: string;
  recommended: boolean;
  href: string | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  ShieldCheck,
  Gem,
  Award,
  Star,
  Crown,
  Rocket,
  TrendingUp,
  Globe,
  BarChart3,
  Headphones,
  Mail,
  CheckCircle,
};

function resolveIcon(iconName: string | null) {
  if (!iconName) return CheckCircle;
  const Component = ICON_MAP[iconName];
  return Component || CheckCircle;
}

export default function PromoteYourBusinessPage() {
  const [plans, setPlans] = useState<DynamicPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingPlans(true);
    setPlansError(null);

    async function loadPlans() {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const token = getAuthToken();
        const url = `${apiBaseUrl}/api/public/plans`;
        const response = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!cancelled) {
          setPlans(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setPlansError(getApiErrorMessage(err, "Failed to load plans."));
          setPlans([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPlans(false);
        }
      }
    }

    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayPlans = useMemo(() => plans, [plans]);

  const allFeatures = useMemo(() => {
    const set = new Set<string>();
    for (const plan of displayPlans) {
      for (const f of plan.features) {
        set.add(f);
      }
    }
    return Array.from(set);
  }, [displayPlans]);

  useEffect(() => {
    if (!selectedPlan && displayPlans.length > 0) {
      const firstNamed = displayPlans.find((p) => !p.href);
      if (firstNamed) setSelectedPlan(firstNamed.name);
    }
  }, [displayPlans, selectedPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();
      const payload = {
        name,
        email,
        subject: `Promotion Request: ${selectedPlan} for ${businessName}`,
        message: `
          Business Name: ${businessName}
          Contact Person: ${name}
          Contact Number: ${contact}
          Email: ${email}
          Selected Plan: ${selectedPlan}
        `,
      };
      const response = await axios.post(
        `${apiBaseUrl}/api/contact`,
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setMessage(
        response.data?.message ||
          "Your request has been sent. We will contact you shortly.",
      );
      setName("");
      setEmail("");
      setContact("");
      setBusinessName("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send your request."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Plans & Pricing | LocalOnline</title>
        <meta
          name="description"
          content="Choose a plan to promote your business on LocalOnline. Get featured, run ads, and reach more local customers."
        />
      </Head>
      <SiteShell>
        <section className="pub-container py-12">
          <div className="text-center">
            <h1 className="pub-title">Promote Your Business</h1>
            <p className="pub-subtitle mt-4 max-w-2xl mx-auto">
              Select a plan that fits your needs and get discovered by thousands
              of local customers in your neighborhood.
            </p>
          </div>

          {plansError && (
            <p className="app-muted text-center mt-6">{plansError}</p>
          )}

          <div className="mt-12">
            {loadingPlans ? (
              <p className="app-loading text-center">Loading plans...</p>
            ) : displayPlans.length === 0 ? (
              <p className="app-muted text-center">
                No plans are available right now. Please check back later.
              </p>
            ) : (
              <>
                <div className="pricing-table-desktop overflow-x-auto">
                  <table className="w-full pricing-table">
                    <thead>
                      <tr>
                        <th className="text-left feature-header">Features</th>
                        {displayPlans.map((plan) => {
                          const IconComponent = resolveIcon(plan.icon);
                          return (
                            <th
                              key={plan.id}
                              className={plan.recommended ? "recommended" : ""}
                            >
                              {plan.recommended && (
                                <div className="recommended-badge">Most Popular</div>
                              )}
                              <div className="flex items-center justify-center gap-2 mt-2">
                                <IconComponent className="h-5 w-5" />
                                <span>{plan.name}</span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="price-row">
                        <td className="font-semibold">Monthly Price</td>
                        {displayPlans.map((plan) => (
                          <td
                            key={`${plan.id}-monthly`}
                            className={plan.recommended ? "recommended" : ""}
                          >
                            {plan.priceMonthly}
                          </td>
                        ))}
                      </tr>
                      <tr className="price-row">
                        <td className="font-semibold">Quarterly Price</td>
                        {displayPlans.map((plan) => (
                          <td
                            key={`${plan.id}-quarterly`}
                            className={plan.recommended ? "recommended" : ""}
                          >
                            {plan.priceQuarterly}
                          </td>
                        ))}
                      </tr>
                      <tr className="price-row annual-price-row">
                        <td className="font-semibold">Annual Price</td>
                        {displayPlans.map((plan) => (
                          <td
                            key={`${plan.id}-annual`}
                            className={plan.recommended ? "recommended" : ""}
                          >
                            {plan.priceAnnual}
                          </td>
                        ))}
                      </tr>
                      {allFeatures.map((feature) => (
                        <tr key={feature}>
                          <td>{feature}</td>
                          {displayPlans.map((plan) => {
                            const planFeatures = new Set(plan.features);
                            const hasFeature = planFeatures.has(feature);
                            return (
                              <td
                                key={`${plan.id}-${feature}`}
                                className={plan.recommended ? "recommended" : ""}
                              >
                                {hasFeature ? (
                                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td></td>
                        {displayPlans.map((plan) => (
                          <td
                            key={`${plan.id}-cta`}
                            className={plan.recommended ? "recommended" : ""}
                          >
                            <a
                              href={plan.href || "#request-form"}
                              onClick={() =>
                                !plan.href ? setSelectedPlan(plan.name) : null
                              }
                              className="mt-4 block w-full text-center bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                            >
                              {plan.cta}
                            </a>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pricing-table-mobile grid gap-6">
                  {displayPlans.map((plan) => {
                    const IconComponent = resolveIcon(plan.icon);
                    return (
                      <div
                        key={plan.id}
                        className={`pricing-plan-card ${plan.recommended ? "recommended" : ""}`}
                      >
                        {plan.recommended && (
                          <div className="recommended-badge-mobile">Most Popular</div>
                        )}
                        <h3 className="plan-name flex items-center justify-center gap-2">
                          <IconComponent className="h-5 w-5" />
                          {plan.name}
                        </h3>
                        <div className="plan-prices">
                          <div className="plan-price-row">
                            <span>Monthly:</span> {plan.priceMonthly}
                          </div>
                          <div className="plan-price-row">
                            <span>Quarterly:</span> {plan.priceQuarterly}
                          </div>
                          <div className="plan-price-row annual">
                            <span>Annual:</span> {plan.priceAnnual}
                          </div>
                        </div>
                        <ul className="plan-features">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="plan-feature-item">
                              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <a
                          href={plan.href || "#request-form"}
                          onClick={(e) => {
                            if (!plan.href) {
                              e.preventDefault();
                              setSelectedPlan(plan.name);
                              document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className="plan-cta-btn"
                        >
                          {plan.cta}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <section id="request-form" className="pub-container py-12">
          <div className="max-w-2xl mx-auto request-form-card">
            <h2 className="text-3xl font-bold text-center">
              Request a Promotion Plan
            </h2>
            <p className="text-center text-gray-600 mt-2">
              Fill out the form below and our team will get in touch with you to
              get started.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {message && (
                <div className="form-alert is-success">{message}</div>
              )}
              {error && <div className="form-alert is-error">{error}</div>}

              <div>
                <label htmlFor="plan" className="block font-medium">
                  Selected Plan
                </label>
                <select
                  id="plan"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="form-input"
                >
                  {displayPlans
                    .filter((p) => !p.href)
                    .map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="businessName" className="block font-medium">
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Your Business Name"
                />
              </div>

              <div>
                <label htmlFor="name" className="block font-medium">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="form-input"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block font-medium">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="contact" className="block font-medium">
                  Contact Number
                </label>
                <input
                  id="contact"
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  className="form-input"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="form-submit-btn"
                >
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </section>
        <style jsx>{`
          .pricing-table-mobile {
            display: none;
          }
          .pricing-plan-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            box-shadow: var(--shadow-subtle);
            position: relative;
          }
          .pricing-plan-card.recommended {
            border: 2px solid var(--marigold);
            background: rgba(255, 184, 0, 0.02);
          }
          .recommended-badge-mobile {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--marigold);
            color: var(--midnight);
            padding: 4px 16px;
            border-radius: 16px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .plan-name {
            margin: 12px 0 16px;
            font-size: 1.25rem;
            font-weight: 700;
            text-align: center;
            color: var(--text);
          }
          .plan-prices {
            display: grid;
            gap: 8px;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border);
          }
          .plan-price-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.95rem;
          }
          .plan-price-row span {
            color: var(--muted);
            font-weight: 500;
          }
          .plan-price-row.annual {
            color: var(--marigold);
            font-weight: 700;
          }
          .plan-price-row.annual span {
            color: var(--marigold);
          }
          .plan-features {
            list-style: none;
            padding: 0;
            margin: 0 0 20px;
            display: grid;
            gap: 10px;
          }
          .plan-feature-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 0.95rem;
          }
          .plan-feature-item span {
            color: var(--text);
          }
          .plan-cta-btn {
            display: block;
            width: 100%;
            text-align: center;
            background: var(--teal-600);
            color: white;
            font-weight: 600;
            padding: 12px 20px;
            border-radius: 8px;
            text-decoration: none;
            transition: background 0.2s;
          }
          .plan-cta-btn:hover {
            background: var(--teal-700);
          }

          .pricing-table {
            border-collapse: separate;
            border-spacing: 0;
            min-width: 800px;
            width: 100%;
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          }
          .pricing-table th,
          .pricing-table td {
            padding: 1rem 1.25rem;
            text-align: center;
            vertical-align: middle;
            transition: background-color 0.2s;
          }
          .pricing-table th {
            background-color: var(--surface);
            font-size: 1.1rem;
            font-weight: 600;
            border-bottom: 2px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 10;
          }
          .pricing-table .feature-header {
            font-size: 1.25rem;
            background-color: var(--midnight);
            border-right: 1px solid var(--border);
            left: 0;
            z-index: 20;
            color: white;
          }
          .pricing-table tbody tr:nth-child(even) {
            background-color: var(--surface-light);
          }
          .pricing-table tbody tr:hover {
            background-color: color-mix(
              in srgb,
              var(--marigold) 5%,
              transparent
            );
          }
          .pricing-table .price-row {
            font-size: 1.1rem;
            font-weight: 500;
          }
          .pricing-table .annual-price-row {
            color: var(--marigold);
            font-size: 1.2rem;
            font-weight: 700;
          }
          .pricing-table th.recommended,
          .pricing-table td.recommended {
            background-color: rgba(255, 184, 0, 0.05);
          }
          .pricing-table th.recommended {
            position: relative;
            border-top: 3px solid var(--marigold);
            border-left: 1px solid var(--marigold);
            border-right: 1px solid var(--marigold);
          }
          .pricing-table td.recommended {
            border-left: 1px solid var(--marigold);
            border-right: 1px solid var(--marigold);
          }
          .pricing-table tr:last-of-type td.recommended {
            border-bottom: 3px solid var(--marigold);
          }
          .recommended-badge {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--marigold);
            color: var(--midnight);
            padding: 4px 16px;
            border-radius: 16px;
            font-size: 0.8rem;
            font-weight: bold;
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          @media (max-width: 768px) {
            .pricing-table-desktop {
              display: none;
            }
            .pricing-table-mobile {
              display: grid;
            }
          }

          .request-form-card {
            background-color: var(--surface);
            padding: 2rem;
            border-radius: 12px;
            border: 1px solid var(--border);
          }
          .form-input,
          .form-submit-btn {
            width: 100%;
            margin-top: 0.25rem;
            border-radius: 8px;
            border: 1px solid var(--border);
            background-color: var(--surface-light);
            padding: 0.75rem 1rem;
            transition:
              border-color 0.2s,
              box-shadow 0.2s;
          }
          .form-input:focus {
            outline: none;
            border-color: var(--marigold);
            box-shadow: 0 0 0 2px rgba(255, 184, 0, 0.2);
          }
          .form-input::placeholder {
            color: #71717a;
          }
          .form-submit-btn {
            background-color: var(--teal-600);
            color: white;
            font-weight: 600;
            cursor: pointer;
            border: none;
          }
          .form-submit-btn:hover:not(:disabled) {
            background-color: var(--teal-700);
          }
          .form-submit-btn:disabled {
            background-color: #3f3f46;
            cursor: not-allowed;
          }
          .form-alert {
            padding: 1rem;
            border-radius: 8px;
            border-width: 1px;
            border-style: solid;
            font-weight: 500;
          }
          .form-alert.is-success {
            background-color: rgba(16, 185, 129, 0.1);
            border-color: rgba(16, 185, 129, 0.2);
            color: #6ee7b7;
          }
          .form-alert.is-error {
            background-color: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.2);
            color: #fca5a5;
          }
        `}</style>
      </SiteShell>
    </>
  );
}
