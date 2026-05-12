import type { NextApiRequest, NextApiResponse } from "next";
import { getServiceToken } from "../../../lib/serviceAuth";
import { getAuthTokenFromCookieHeader } from "../../../lib/authCookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const path = req.query.path ? (Array.isArray(req.query.path) ? req.query.path : [req.query.path]) : [];
  const apiBaseUrl =
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
  const qsIndex = req.url?.indexOf("?") ?? -1;
  const queryString = qsIndex >= 0 ? req.url?.slice(qsIndex) ?? "" : "";
  const targetUrl = `${apiBaseUrl}/api/public-search/${path.join("/")}${queryString}`;
  const cookieToken = getAuthTokenFromCookieHeader(req.headers.cookie);
  const incomingAuth = req.headers.authorization ?? (cookieToken ? `Bearer ${cookieToken}` : undefined);
  let token: string | null = null;
  try {
    token = incomingAuth ? null : await getServiceToken(apiBaseUrl);
  } catch {
    token = null;
  }
  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      ...(incomingAuth ? { Authorization: incomingAuth } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await response.text();
  res.status(response.status);
  const cache = response.headers.get("cache-control");
  if (cache) res.setHeader("cache-control", cache);
  res.setHeader("content-type", response.headers.get("content-type") ?? "application/json");
  res.send(body);
}
