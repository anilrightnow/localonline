import Link from "next/link";
import type { SearchBusinessItem } from "../../lib/publicApi";
import {
  fallbackThumbnail,
  resolveBusinessThumbnail,
} from "../../lib/thumbnail";
import {
  Star,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle2,
  Navigation,
} from "lucide-react";

type BusinessCardProps = {
  business: SearchBusinessItem;
  variant?: "grid" | "list";
  fallbackCategory?: string;
  fallbackArea?: string;
  fallbackCity?: string;
  showDetailsButton?: boolean;
};

function toStars(value?: number | null): string {
  if (value == null || Number.isNaN(value)) {
    return "No rating";
  }
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return `${"\u2605".repeat(rounded)}${"\u2606".repeat(5 - rounded)}`;
}

function cleanText(value?: string | null): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildBusinessDescription(
  business: SearchBusinessItem,
  fallbackCategory?: string,
  fallbackArea?: string,
  fallbackCity?: string,
): string {
  const description = cleanText(business.description);
  if (description) return description;

  const location = [cleanText(fallbackArea), cleanText(fallbackCity)]
    .filter(Boolean)
    .join(", ");
  const category = cleanText(fallbackCategory);
  const address = cleanText(business.address);
  const reviewText =
    business.rating != null
      ? ` Rated ${business.rating.toFixed(1)} from ${business.totalReviews ?? 0} reviews.`
      : "";
  const locationText = location ? ` in ${location}` : "";
  const categoryText = category ? `${category} business` : "local business";
  const addressText = address ? ` Located at ${address}.` : "";

  return `${business.name} is a ${categoryText}${locationText}.${addressText}${reviewText} View contact details, reviews, and directions for this listing.`;
}

export default function BusinessCard({
  business,
  variant = "grid",
  fallbackCategory,
  fallbackArea,
  fallbackCity,
  showDetailsButton = true,
}: BusinessCardProps) {
  const fallback = fallbackThumbnail({
    category: fallbackCategory,
    area: fallbackArea,
    city: fallbackCity,
    businessName: business.name,
  });
  const thumb = resolveBusinessThumbnail(business, fallback);
  const description = buildBusinessDescription(
    business,
    fallbackCategory,
    fallbackArea,
    fallbackCity,
  );

  return (
    <article
      className={`pub-biz-card ${variant === "list" ? "pub-biz-card-list" : ""}`}
    >
      <div className="pub-biz-image-wrap">
        <Link
          href={business.canonicalPath}
          className="pub-biz-image-link"
          aria-label={`Open ${business.name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt={`${business.name} thumbnail`}
            className="pub-biz-image"
            loading="lazy"
          />
          {business.rating && business.rating >= 4.5 && (
            <span className="pub-biz-badge top-rated">
              <Star size={12} fill="currentColor" /> Top Rated
            </span>
          )}
          <span className="pub-biz-badge verified">
            <CheckCircle2 size={12} /> Verified
          </span>
        </Link>
      </div>

      <div className="pub-biz-body">
        <h3 className="pub-biz-title">
          <Link href={business.canonicalPath}>{business.name}</Link>
        </h3>

        {/* Structured Rating Row for easier CSS styling */}
        <div className="pub-biz-rating-row">
          <div className="pub-stars-wrap" title={toStars(business.rating)}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.round(business.rating ?? 0)
                    ? "star-filled"
                    : "star-empty"
                }
              />
            ))}
          </div>
          <span className="pub-rating-num">
            {business.rating != null ? business.rating.toFixed(1) : "N/A"}
          </span>
          <span className="pub-review-count">
            ({business.totalReviews ?? 0})
          </span>
        </div>

        <p className="pub-biz-address">
          <MapPin size={14} className="icon" />{" "}
          {business.address ?? "Address unavailable"}
        </p>

        <p className="pub-biz-desc">{description}</p>

        {/* Added Action Buttons for better UX/Monetization tracking */}
        <div className="pub-biz-actions">
          {business.phone && (
            <a href={`tel:${business.phone}`} className="pub-btn-call">
              <Phone size={14} /> Call
            </a>
          )}
          {showDetailsButton ? (
            <Link href={business.canonicalPath} className="pub-btn-directions">
              <Navigation size={14} /> Details <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
