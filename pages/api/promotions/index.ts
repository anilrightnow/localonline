import type { NextApiRequest, NextApiResponse } from "next";
import { getServiceToken } from "../../../lib/serviceAuth";
import { getAuthTokenFromCookieHeader } from "../../../lib/authCookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiBaseUrl =
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5000";

  const cookieToken = getAuthTokenFromCookieHeader(req.headers.cookie);
  const incomingAuth = req.headers.authorization ?? (cookieToken ? `Bearer ${cookieToken}` : undefined);

  let token: string | null = null;
  try {
    token = incomingAuth ? null : await getServiceToken(apiBaseUrl);
  } catch {
    token = null;
  }

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.body == null) {
      body = undefined;
    } else if (typeof req.body === "string") {
      body = req.body;
    } else {
      body = JSON.stringify(req.body);
    }
  }

  const targetUrl = `${apiBaseUrl.replace(/\/+$/, "")}/api/promotions`;

  const response = await fetch(targetUrl, {
    method: req.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(incomingAuth ? { Authorization: incomingAuth } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const responseBody = await response.text();
  res.status(response.status);
  const cache = response.headers.get("cache-control");
  if (cache) res.setHeader("cache-control", cache);
  res.setHeader("content-type", response.headers.get("content-type") ?? "application/json");
  res.send(responseBody);
}