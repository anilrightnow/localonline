import type { GetServerSideProps } from "next";
type Props = Record<string, never>;

function getSiteBase(req: Parameters<GetServerSideProps>[0]["req"]): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_PUBLIC_BASE_URL;
  if (configured) {
    return String(configured).replace(/\/+$/, "");
  }
  const protoHeader = req.headers["x-forwarded-proto"];
  const hostHeader = req.headers["x-forwarded-host"] ?? req.headers.host;
  const forwardedProto = Array.isArray(protoHeader)
    ? protoHeader[0]
    : protoHeader;
  const socketEncrypted = (req.socket as { encrypted?: boolean }).encrypted;
  const proto = forwardedProto || (socketEncrypted ? "https" : "http");
  const host = Array.isArray(hostHeader)
    ? hostHeader[0]
    : hostHeader || "localhost";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  res,
}) => {
  const siteBase = getSiteBase(req);
  const paths = [
    "/sitemaps/cities.xml",
    "/sitemaps/city-areas.xml",
    "/sitemaps/city-categories/1.xml",
    "/sitemaps/city-area-categories/1.xml",
    "/sitemaps/businesses/1.xml",
    "/sitemaps/city-area-place-types/1.xml",
    "/sitemaps/city-area-place-type-places/1.xml",
  ];
  const urls = paths
    .map((path) => `<sitemap><loc>${siteBase}${path}</loc></sitemap>`)
    .join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</sitemapindex>`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=900");
  res.write(body);
  res.end();

  return { props: {} };
};

export default function SiteMap() {
  return null;
}
