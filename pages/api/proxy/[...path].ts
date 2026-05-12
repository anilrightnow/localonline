import type { NextApiRequest, NextApiResponse } from "next";
import { getServiceToken } from "../../../lib/serviceAuth";
import { getAuthTokenFromCookieHeader } from "../../../lib/authCookie";

function buildTargetUrl(req: NextApiRequest, apiBaseUrl: string): string {
  const path = req.query.path
    ? Array.isArray(req.query.path)
      ? req.query.path
      : [req.query.path]
    : [];
  const qsIndex = req.url?.indexOf("?") ?? -1;
  const queryString = qsIndex >= 0 ? req.url?.slice(qsIndex) ?? "" : "";
  const targetPath = `/${path.join("/")}`.replace(/\/+$/, "");
  return `${apiBaseUrl.replace(/\/+$/, "")}${targetPath}${queryString}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiBaseUrl =
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

  const cookieToken = getAuthTokenFromCookieHeader(req.headers.cookie);
  const incomingAuth = req.headers.authorization ?? (cookieToken ? `Bearer ${cookieToken}` : undefined);

  let authHeader = incomingAuth;
  if (!authHeader) {
    try {
      const token = await getServiceToken(apiBaseUrl);
      if (token) authHeader = `Bearer ${token}`;
    } catch {
      authHeader = undefined;
    }
  }

  const method = req.method ?? "GET";
  const targetUrl = buildTargetUrl(req, apiBaseUrl);

  const headers: Record<string, string> = {};
  if (authHeader) headers["Authorization"] = authHeader;
  if (req.headers["content-type"]) {
    headers["Content-Type"] = String(req.headers["content-type"]);
  }

  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    if (req.body == null) {
      body = undefined;
    } else if (typeof req.body === "string") {
      body = req.body;
    } else {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      body = JSON.stringify(req.body);
    }
  }

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
  });

  const responseBody = await response.text();
  res.status(response.status);
  const cache = response.headers.get("cache-control");
  if (cache) res.setHeader("cache-control", cache);
  res.setHeader("content-type", response.headers.get("content-type") ?? "application/json");
  res.send(responseBody);
}
