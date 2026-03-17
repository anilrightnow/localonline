import type { NextApiRequest, NextApiResponse } from "next";

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
    const response = await fetch(
      `${apiBaseUrl}/api/public-search/suggestions?q=${encodeURIComponent(q.trim())}&limit=${encodeURIComponent(limit)}${cityQuery}`
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
