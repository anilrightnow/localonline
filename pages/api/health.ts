import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
  backend?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // Attempt a simple health check call to your backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeout);

    if (response.ok) {
      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        backend: 'connected',
      });
    }

    return res.status(503).json({
      status: 'error',
      message: 'Service temporarily unavailable',
      timestamp: new Date().toISOString(),
      backend: `failed-${response.status}`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(503).json({
      status: 'error',
      message: `Unable to connect to service: ${errorMsg}`,
      timestamp: new Date().toISOString(),
      backend: 'unreachable',
    });
  }
}
