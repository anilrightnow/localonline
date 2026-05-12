import type { NextApiRequest, NextApiResponse } from "next";
import { getServiceToken } from "../../../lib/serviceAuth";
import { getAuthTokenFromCookieHeader } from "../../../lib/authCookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const limit = typeof req.query.limit === "string" ? req.query.limit : "10";
  const citySlug = typeof req.query.citySlug === "string" ? req.query.citySlug : "";
  const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

  if (!q || q.trim().length < 2) {
    res.status(200).json([]);
    return;
  }

  try {
    const cityQuery = citySlug.trim() ? `&citySlug=${encodeURIComponent(citySlug.trim())}` : "";
    const cookieToken = getAuthTokenFromCookieHeader(req.headers.cookie);
    const incomingAuth =
      req.headers.authorization ?? (cookieToken ? `Bearer ${cookieToken}` : undefined);
    let token: string | null = null;
    if (!incomingAuth) {
      try {
        token = await getServiceToken(apiBaseUrl);
      } catch {
        token = null;
      }
    }
    const response = await fetch(
      `${apiBaseUrl}/api/public-search/suggestions?q=${encodeURIComponent(q.trim())}&limit=${encodeURIComponent(limit)}${cityQuery}`,
      {
        headers: {
          ...(incomingAuth ? { Authorization: incomingAuth } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      res.status(200).json([]);
      return;
    }

    const payload = await response.json();
    res.status(200).json(payload);
  } catch {
    res.status(200).json([]);
  }
}
