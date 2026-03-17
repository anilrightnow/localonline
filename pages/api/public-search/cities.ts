import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
  try {
    const response = await fetch(`${apiBaseUrl}/api/public-search/cities`);
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
