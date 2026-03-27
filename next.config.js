/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
    return [
      { source: "/api/auth/:path*", destination: `${apiBaseUrl}/api/auth/:path*` },
      { source: "/api/user/:path*", destination: `${apiBaseUrl}/api/user/:path*` },
      { source: "/api/admin/:path*", destination: `${apiBaseUrl}/api/admin/:path*` },
      { source: "/api/admin/listing-updates/:path*", destination: `${apiBaseUrl}/api/admin/listing-updates/:path*` },
      { source: "/api/superadmin/:path*", destination: `${apiBaseUrl}/api/superadmin/:path*` },
      { source: "/api/subscriptions/:path*", destination: `${apiBaseUrl}/api/subscriptions/:path*` },
      { source: "/api/plans/:path*", destination: `${apiBaseUrl}/api/plans/:path*` },
      { source: "/api/plan/:path*", destination: `${apiBaseUrl}/api/plan/:path*` },
      { source: "/api/master/:path*", destination: `${apiBaseUrl}/api/master/:path*` },
      { source: "/api/community/:path*", destination: `${apiBaseUrl}/api/community/:path*` },
      { source: "/api/reviews/:path*", destination: `${apiBaseUrl}/api/reviews/:path*` },
      { source: "/api/listing-claims/:path*", destination: `${apiBaseUrl}/api/listing-claims/:path*` },
      { source: "/api/owner-listings/:path*", destination: `${apiBaseUrl}/api/owner-listings/:path*` },
      { source: "/api/promotions/:path*", destination: `${apiBaseUrl}/api/promotions/:path*` },
      { source: "/api/ad-requests/:path*", destination: `${apiBaseUrl}/api/ad-requests/:path*` },
      { source: "/api/admin/ad-requests/:path*", destination: `${apiBaseUrl}/api/admin/ad-requests/:path*` },
      { source: "/api/analytics/:path*", destination: `${apiBaseUrl}/api/analytics/:path*` },
    ];
  },
};

module.exports = nextConfig;
