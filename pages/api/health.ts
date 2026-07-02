import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  status: 'ok' | 'error' | 'maintenance';
  message?: string;
  timestamp: string;
  backend?: string;
  maintenance?: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      // Handle maintenance mode response
      if (data.status === 'maintenance') {
        return res.status(503).json({
          status: 'maintenance',
          message: data.message || 'System is under maintenance',
          timestamp: data.timestamp,
          maintenance: true,
        });
      }
      return res.status(200).json({
        status: 'ok',
        timestamp: data.timestamp,
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
