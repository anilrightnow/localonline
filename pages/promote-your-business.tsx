import Head from "next/head";
import React, { useMemo, useState } from "react";
import axios from "axios";
import SiteShell from "../components/public/SiteShell";
import { getApiBaseUrl } from "../lib/publicApi";
import { getApiErrorMessage } from "../lib/apiError";
import { CheckCircle, Zap, ShieldCheck, Gem, Award } from "lucide-react";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

interface Plan {
  name: string;
  price: string;
  priceMonthly: string;
  priceQuarterly: string;
  priceAnnual: string;
  features: string[];
  icon: JSX.Element;
  cta: string;
  recommended?: boolean;
  href?: string;
}

const plans: Plan[] = [
  {
    name: "Free / Basic Listing",
    price: "Free",
    priceMonthly: "Free",
    priceQuarterly: "Free",
    priceAnnual: "Always free",
    features: [
      "Claim your business listing",
      "Update basic information",
      "Display photos",
      //"Receive and respond to reviews",
    ],
    icon: <CheckCircle className="h-6 w-6 text-gray-500" />,
    cta: "Claim Now",
    href: "/claims",
  },
  {
    name: "Starter Boost",
    price: "₹999",
    priceMonthly: "₹999/month",
    priceQuarterly: "₹2,847/quarter (5% off)",
    priceAnnual: "₹10,789/year (10% off)",
    features: [
      "All Basic features",
      "Premium badge on your listing",
      "Improved ranking in search results",
      "Inclusion in one banner ad rotation",
    ],
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    cta: "Request Now",
  },
  {
    name: "Growth Plan",
    price: "₹2,499",
    priceMonthly: "₹2,499/month",
    priceQuarterly: "₹7,122/quarter (5% off)",
    priceAnnual: "₹26,989/year (10% off)",
    features: [
      "All Starter Boost features",
      "Featured listing placement",
      "Medium-sized banner ad placement",
      "Access to listing analytics",
      //"Lead notifications via email",
    ],
    icon: <Award className="h-6 w-6 text-blue-500" />,
    cta: "Request Now",
    recommended: true,
  },
  {
    name: "Premium Dominance",
    price: "₹4,999",
    priceMonthly: "₹4,999/month",
    priceQuarterly: "₹14,247/quarter (5% off)",
    priceAnnual: "₹53,989/year (10% off)",
    features: [
      "All Growth Plan features",
      "Top featured listing placement",
      "Homepage banner ad placement",
      "Priority customer support",
      "Monthly performance reports",
    ],
    icon: <Gem className="h-6 w-6 text-purple-500" />,
    cta: "Request Now",
  },
];

const allFeatures = [
  "Claim your business listing",
  "Update basic information",
  "Display photos",
  //"Receive and respond to reviews",
  "Premium badge on your listing",
  "Improved ranking in search results",
  "Inclusion in one banner ad rotation",
  "Featured listing placement",
  "Medium-sized banner ad placement",
  "Access to listing analytics",
  //"Lead notifications via email",
  "Top featured listing placement",
  "Homepage banner ad placement",
  "Priority customer support",
  "Monthly performance reports",
];

export default function PromoteYourBusinessPage({
  plans: fetchedPlans,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Starter Boost");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayPlans = useMemo(() => {
    // You can augment fetchedPlans with icons and other UI data here
    // For now, we'll use the hardcoded ones for UI and fetched for data logic
    return plans;
  }, [fetchedPlans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
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
      const response = await axios.post(`${apiBaseUrl}/api/contact`, payload);
      setMessage(
        response.data?.message ||
          "Your request has been sent. We will contact you shortly.",
      );
      // Reset form
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

          <div className="mt-12 overflow-x-auto">
            <table className="w-full pricing-table">
              <thead>
                <tr>
                  <th className="text-left feature-header">Features</th>
                  {displayPlans.map((plan) => (
                    <th
                      key={plan.name}
                      className={plan.recommended ? "recommended" : ""}
                    >
                      {plan.recommended && (
                        <div className="recommended-badge">Most Popular</div>
                      )}
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="price-row">
                  <td className="font-semibold">Monthly Price</td>
                  {displayPlans.map((plan) => (
                    <td
                      key={`${plan.name}-monthly`}
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
                      key={`${plan.name}-quarterly`}
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
                      key={`${plan.name}-annual`}
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
                          key={`${plan.name}-${feature}`}
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
                      key={`${plan.name}-cta`}
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
                  {plans
                    .filter((p) => p.name !== "Free / Basic Listing")
                    .map((p) => (
                      <option key={p.name} value={p.name}>
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
          .py-12 {
            padding-top: 3rem;
            padding-bottom: 3rem;
          }
          .mt-12 {
            margin-top: 3rem;
          }
          /* === Pricing Table UX/UI Styles === */
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

          /* === Form UX/UI Styles === */
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

export const getServerSideProps: GetServerSideProps<{
  plans: Plan[];
}> = async (ctx) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.get(`${apiBaseUrl}/api/plans`);
    return {
      props: {
        plans: response.data,
      },
    };
  } catch (error) {
    console.error("Failed to fetch plans", error);
    return {
      props: {
        plans: [], // Fallback to empty array on error
      },
    };
  }
};
