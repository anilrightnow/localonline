type GoogleAdSize =
  | "leaderboard"
  | "large-mobile-banner"
  | "in-feed"
  | "medium-rectangle"
  | "responsive-display";

type GoogleAdSlotProps = {
  slot: string;
  size: GoogleAdSize;
  label?: string;
  className?: string;
};

const isGoogleAdsEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED === "true";

const sizeMap: Record<
  GoogleAdSize,
  { title: string; dimensions: string; format: string }
> = {
  leaderboard: {
    title: "Sponsored",
    dimensions: "728 x 90",
    format: "Horizontal display",
  },
  "large-mobile-banner": {
    title: "Sponsored",
    dimensions: "320 x 100",
    format: "Mobile banner",
  },
  "in-feed": {
    title: "Sponsored listing",
    dimensions: "Fluid",
    format: "In-feed native",
  },
  "medium-rectangle": {
    title: "Sponsored",
    dimensions: "300 x 250",
    format: "Display rectangle",
  },
  "responsive-display": {
    title: "Sponsored",
    dimensions: "Responsive",
    format: "Display ad",
  },
};

export default function GoogleAdSlot({
  slot,
  size,
  label,
  className = "",
}: GoogleAdSlotProps) {
  if (!isGoogleAdsEnabled) {
    return null;
  }

  const meta = sizeMap[size];

  return (
    <aside
      className={`pub-google-ad pub-google-ad-${size} ${className}`.trim()}
      aria-label={label || meta.title}
      data-ad-slot={slot}
      data-ad-size={size}
    >
      <span className="pub-google-ad-label">Ad</span>
      <div className="pub-google-ad-inner">
        <strong>{label || meta.title}</strong>
        <span>{meta.format}</span>
        <small>{meta.dimensions}</small>
      </div>
      {/* Replace this placeholder with your AdSense <ins className="adsbygoogle"> code for slot: {slot}. */}
    </aside>
  );
}

export function GoogleLeaderboardAd(props: Omit<GoogleAdSlotProps, "size">) {
  return <GoogleAdSlot {...props} size="leaderboard" />;
}

export function GoogleInFeedAd(props: Omit<GoogleAdSlotProps, "size">) {
  return <GoogleAdSlot {...props} size="in-feed" />;
}

export function GoogleMediumRectangleAd(
  props: Omit<GoogleAdSlotProps, "size">,
) {
  return <GoogleAdSlot {...props} size="medium-rectangle" />;
}

export function GoogleResponsiveDisplayAd(
  props: Omit<GoogleAdSlotProps, "size">,
) {
  return <GoogleAdSlot {...props} size="responsive-display" />;
}

export function GoogleLargeMobileBannerAd(
  props: Omit<GoogleAdSlotProps, "size">,
) {
  return <GoogleAdSlot {...props} size="large-mobile-banner" />;
}
