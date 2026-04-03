import type { NextApiRequest, NextApiResponse } from "next";
import { getServiceToken } from "../../../lib/serviceAuth";
import { getAuthTokenFromCookieHeader } from "../../../lib/authCookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
  try {
    const cookieToken = getAuthTokenFromCookieHeader(req.headers.cookie);
    const incomingAuth =
      req.headers.authorization ?? (cookieToken ? `Bearer ${cookieToken}` : undefined);
    const token = incomingAuth ? null : await getServiceToken(apiBaseUrl);
    if (!incomingAuth && !token) {
      res.status(500).json([]);
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/public-search/cities`, {
      headers: {
        ...(incomingAuth ? { Authorization: incomingAuth } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
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
