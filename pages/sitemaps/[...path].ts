import type { GetServerSideProps } from "next";
import { fetchSitemapData, type SitemapResponse } from "../../lib/publicApi";
type Props = Record<string, never>;

type ReqWithHeaders = Parameters<GetServerSideProps>[0]["req"];

type SitemapParams = {
  path?: string[];
};

function getSiteBase(req: ReqWithHeaders): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??"https://localonline.in"
    process.env.PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_PUBLIC_BASE_URL;
  if (configured) {
    return String(configured).replace(/\/+$/, "");
  }
  const protoHeader = req.headers["x-forwarded-proto"];
  const hostHeader = req.headers["x-forwarded-host"] ?? req.headers.host;
  const forwardedProto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const socketEncrypted = (req.socket as { encrypted?: boolean }).encrypted;
  const proto = forwardedProto || (socketEncrypted ? "https" : "http");
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader || "localhost";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

function rewriteSitemap(xml: string, apiBase: string, siteBase: string): string {
  let apiOrigin = "";
  let siteOrigin = "";
  try {
    apiOrigin = new URL(apiBase).origin;
    siteOrigin = new URL(siteBase).origin;
  } catch {
    return xml;
  }

  return xml.replace(/<loc>([^<]+)<\/loc>/g, (_match, loc) => {
    try {
      const url = new URL(loc, apiOrigin);
      if (url.origin === apiOrigin) {
        url.protocol = new URL(siteOrigin).protocol;
        url.host = new URL(siteOrigin).host;
        return `<loc>${url.toString()}</loc>`;
      }
    } catch {
      return `<loc>${loc}</loc>`;
    }
    return `<loc>${loc}</loc>`;
  });
}

export const getServerSideProps: GetServerSideProps<Props, SitemapParams> = async ({ req, res, params }) => {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    "http://localhost:5000";
  const siteBase = getSiteBase(req);
  const path = params?.path?.join("/") || "";
  const apiUrl = `${apiBaseUrl.replace(/\/+$/, "")}/sitemaps/${path}`;
console.log("Fetching sitemap data from API:", apiUrl);
  try {
    const { fetchSitemapWithServiceAuth } = await import("../../lib/serviceAuth");
    const response = await fetchSitemapWithServiceAuth(apiBaseUrl, apiUrl);
    if (!response.ok) {
      if (response.status === 404) {
        const emptySet =
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=300, s-maxage=900");
        res.write(emptySet);
        res.end();
        return { props: {} };
      }
      res.statusCode = response.status;
      res.end();
      return { props: {} };
    }
    const xml = await response.text();
    const rewritten = rewriteSitemap(xml, apiBaseUrl, siteBase);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=900");
    res.write(rewritten);
    res.end();
  } catch {
    res.statusCode = 502;
    res.end();
  }

  return { props: {} };
};

export default function SiteMapShard() {
  return null;
}
