import Link from "next/link";
import type { SearchBusinessItem } from "../../lib/publicApi";
import { fallbackThumbnail, resolveBusinessThumbnail } from "../../lib/thumbnail";

type BusinessCardProps = {
  business: SearchBusinessItem;
  variant?: "grid" | "list";
  fallbackCategory?: string;
  fallbackArea?: string;
  fallbackCity?: string;
};

function toStars(value?: number | null): string {
  if (value == null || Number.isNaN(value)) {
    return "No rating";
  }
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return `${"\u2605".repeat(rounded)}${"\u2606".repeat(5 - rounded)}`;
}

export default function BusinessCard({
  business,
  variant = "grid",
  fallbackCategory,
  fallbackArea,
  fallbackCity,
}: BusinessCardProps) {
  const fallback = fallbackThumbnail({
    category: fallbackCategory,
    area: fallbackArea,
    city: fallbackCity,
    businessName: business.name,
  });
  const thumb = resolveBusinessThumbnail(business, fallback);

  return (
    <article className={`pub-biz-card ${variant === "list" ? "pub-biz-card-list" : ""}`}>
      <div className="pub-biz-image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt={`${business.name} thumbnail`} className="pub-biz-image" loading="lazy" />
      </div>
      <div className="pub-biz-body">
        <h3 className="pub-biz-title">
          <Link href={business.canonicalPath}>{business.name}</Link>
        </h3>
        <p className="pub-biz-address">
          {business.address ?? "Address unavailable"}
        </p>
        <p className="pub-biz-meta">
          <span className="pub-stars">{toStars(business.rating)}</span>
          {business.rating != null ? ` (${business.rating.toFixed(1)})` : ""}
          {" | "}
          Reviews: {business.totalReviews ?? 0}
        </p>
      </div>
    </article>
  );
}
