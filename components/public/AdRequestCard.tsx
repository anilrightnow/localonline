import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import FormMessage from "../shared/FormMessage";
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

interface AdPlacement {
  id: string;
  imageUrl: string;
  targetUrl: string;
  title: string;
  type: string;
  duration?: number;
}

type AdRequestCardProps = {
  variant?: "banner" | "sidebar";
  title: string;
  subtitle: string;
  ctaLabel: string;
  type: "FeaturedList" | "BannerHome" | "BannerDetail" | "BannerSearch";
};

export default function AdRequestCard({
  variant = "banner",
  title,
  subtitle,
  ctaLabel,
  type,
}: AdRequestCardProps) {
  const [payload, setPayload] = useState<AdRequestPayload>(emptyPayload);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    async function fetchAds() {
      try {
        let adsType = 1;
        if (type === "FeaturedList") {
          adsType = 0;
        } else if (type === "BannerHome") {
          adsType = 1;
        } else if (type === "BannerDetail") {
          adsType = 2;
        } else if (type === "BannerSearch") {
          adsType = 3;
        }
        // Assuming an endpoint that returns active ad placements
        const response = await apiFetch("/api/public/active-ads");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const filteredAds = data.filter((ad) => ad.type === adsType);
            setAds(filteredAds);
          }
        }
      } catch (err) {
        console.error("Failed to fetch ads:", err);
      }
    }
    fetchAds();
  }, [type]);

  useEffect(() => {
    if (ads.length > 1) {
      const currentAd = ads[currentAdIndex];
      const duration = currentAd?.duration || 5000; // Default to 5 seconds
      const timer = setTimeout(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [currentAdIndex, ads]);

  function updateField(key: keyof AdRequestPayload, value: string) {
    setPayload((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/ad-requests", {
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
      <div className="pub-ad pub-ad-carousel">
        {ads.length > 0 ? (
          <div className="pub-ad-carousel-inner">
            <div
              className="pub-ad-carousel-track"
              style={{
                transform: `translateX(-${currentAdIndex * 100}%)`,
              }}
            >
              {ads.map((ad) => (
                <div className="pub-ad-carousel-slide" key={ad.id}>
                  <a
                    href={ad.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`pub-ad-image-link ${variant === "sidebar" ? "pub-ad-image-sidebar" : ""}`}
                  >
                    <img
                      src={ad.imageUrl}
                      alt={ad.title || "Promotional Ad"}
                      className="pub-ad-media"
                    />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={`pub-ad-image pub-ad-media ${variant === "sidebar" ? "pub-ad-image-sidebar" : ""}`}
            role="img"
            aria-label="Advertisement placeholder"
          >
            Ad space
          </div>
        )}

        <div className="pub-ad-body">
          {ads.length === 0 && (
            <>
              <h3 className="pub-ad-title">{title}</h3>
              <p className="pub-muted">{subtitle}</p>
              <div className="pub-ad-actions">
                <button
                  className="pub-ad-btn"
                  type="button"
                  onClick={() => setIsOpen(true)}
                >
                  {ctaLabel}
                </button>
              </div>
            </>
          )}
          {ads.length > 1 && (
            <div className="pub-ad-carousel-dots">
              {ads.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`pub-ad-carousel-dot ${
                    index === currentAdIndex ? "is-active" : ""
                  }`}
                  onClick={() => setCurrentAdIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isOpen ? (
        <div className="pub-modal-backdrop" role="dialog" aria-modal="true">
          <div className="pub-modal">
            <div className="pub-modal-header">
              <div>
                <h3 className="pub-modal-title">Advertise in this area</h3>
                <p className="pub-muted">
                  Share your details and we will reach out.
                </p>
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
              {message ? (
                <FormMessage message={message} tone="success" />
              ) : null}
              {error ? <FormMessage message={error} tone="error" /> : null}
              <div className="pub-ad-actions">
                <button
                  className="pub-ad-btn"
                  type="submit"
                  disabled={isSubmitting}
                >
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
