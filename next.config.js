/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Enables compression for better transfer sizes
  images: {
    formats: ['image/avif', 'image/webp'], // Support modern high-compression formats
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(favicon.ico|favicon-96x96.png|favicon.svg|site.webmanifest|apple-touch-icon.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/local-online-logo.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/uploads/localonline-banner.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/uploads/localonline-banner-large-size.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(ads_place_holder.png|ads_place_holder.jpg|ads_place_holder.webp|ads_place_holder.avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(:path*).(jpg|jpeg|png|gif|webp|avif|svg|ico|mp4|webm|woff|woff2|ttf|otf|css|js)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5000";
    return [
      { source: "/api/auth/:path*", destination: `${apiBaseUrl}/api/auth/:path*` },
      { source: "/api/owner/register", destination: `${apiBaseUrl}/api/owner/register` },
      { source: "/api/user/:path*", destination: `${apiBaseUrl}/api/user/:path*` },
      { source: "/api/admin/:path*", destination: `${apiBaseUrl}/api/admin/:path*` },
      { source: "/api/superadmin/:path*", destination: `${apiBaseUrl}/api/superadmin/:path*` },
      { source: "/api/subscriptions/:path*", destination: `${apiBaseUrl}/api/subscriptions/:path*` },
      { source: "/api/plans/:path*", destination: `${apiBaseUrl}/api/plans/:path*` },
      { source: "/api/master/:path*", destination: `${apiBaseUrl}/api/master/:path*` },
      { source: "/api/community/:path*", destination: `${apiBaseUrl}/api/community/:path*` },
      { source: "/api/reviews/:path*", destination: `${apiBaseUrl}/api/reviews/:path*` },
      { source: "/api/listing-claims/:path*", destination: `${apiBaseUrl}/api/listing-claims/:path*` },
      { source: "/api/owner-listings/:path*", destination: `${apiBaseUrl}/api/owner-listings/:path*` },
      { source: "/api/promotions/:path*", destination: `${apiBaseUrl}/api/promotions/:path*` },
      { source: "/api/ad-requests/:path*", destination: `${apiBaseUrl}/api/ad-requests/:path*` },
      { source: "/api/analytics/:path*", destination: `${apiBaseUrl}/api/analytics/:path*` },
      { source: "/api/public-search/:path*", destination: `${apiBaseUrl}/api/public-search/:path*` },
      { source: "/api/payments/:path*", destination: `${apiBaseUrl}/api/payments/:path*` },
      { source: "/api/public/:path*", destination: `${apiBaseUrl}/api/public/:path*` },
      { source: "/api/contact", destination: `${apiBaseUrl}/api/contact` },
      { source: "/api/blogs/:path*", destination: `${apiBaseUrl}/api/blogs/:path*` },
      { source: "/sitemaps/:path*", destination: `${apiBaseUrl}/sitemaps/:path*` },
    ];
  },
};

module.exports = nextConfig;
