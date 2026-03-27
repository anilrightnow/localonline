import { FormEvent, useState } from "react";

type AdRequestPayload = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  budget: string;
  message: string;
};

const emptyPayload: AdRequestPayload = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  area: "",
  budget: "",
  message: "",
};

type AdRequestCardProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
};

export default function AdRequestCard({ title, subtitle, ctaLabel }: AdRequestCardProps) {
  const [payload, setPayload] = useState<AdRequestPayload>(emptyPayload);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function updateField(key: keyof AdRequestPayload, value: string) {
    setPayload((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/ad-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Failed to submit request.");
      }
      setMessage("Thanks! Your advertising request was received.");
      setPayload(emptyPayload);
    } catch (err: any) {
      setError(err?.message || "Failed to submit request.");
    }
    setIsSubmitting(false);
  }

  return (
    <>
      <div className="pub-ad">
        <div className="pub-ad-media" role="img" aria-label="Advertisement placeholder">
          Ad space
        </div>
        <div className="pub-ad-body">
          <h3 className="pub-ad-title">{title}</h3>
          <p className="pub-muted">{subtitle}</p>
          <div className="pub-ad-actions">
            <button className="pub-ad-btn" type="button" onClick={() => setIsOpen(true)}>
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div className="pub-modal-backdrop" role="dialog" aria-modal="true">
          <div className="pub-modal">
            <div className="pub-modal-header">
              <div>
                <h3 className="pub-modal-title">Advertise in this area</h3>
                <p className="pub-muted">Share your details and we will reach out.</p>
              </div>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close form"
              >
                Close
              </button>
            </div>
            <form className="pub-ad-form" onSubmit={onSubmit}>
              <div className="pub-ad-grid">
                <input
                  className="form-input"
                  placeholder="Business name"
                  value={payload.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  required
                />
                <input
                  className="form-input"
                  placeholder="Contact name"
                  value={payload.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  required
                />
                <input
                  className="form-input"
                  type="email"
                  placeholder="Email"
                  value={payload.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
                <input
                  className="form-input"
                  placeholder="Phone"
                  value={payload.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  required
                />
                <input
                  className="form-input"
                  placeholder="City"
                  value={payload.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  required
                />
                <input
                  className="form-input"
                  placeholder="Area"
                  value={payload.area}
                  onChange={(e) => updateField("area", e.target.value)}
                  required
                />
                <input
                  className="form-input"
                  placeholder="Monthly budget"
                  value={payload.budget}
                  onChange={(e) => updateField("budget", e.target.value)}
                  required
                />
              </div>
              <textarea
                className="form-textarea"
                placeholder="Tell us what you want to promote"
                value={payload.message}
                onChange={(e) => updateField("message", e.target.value)}
                required
              />
              {message ? <div className="msg msg-success">{message}</div> : null}
              {error ? <div className="msg msg-error">{error}</div> : null}
              <div className="pub-ad-actions">
                <button className="pub-ad-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : ctaLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
