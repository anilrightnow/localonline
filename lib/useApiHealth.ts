import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

const HEALTH_CHECK_INTERVAL = 1500000000; // Check every 15 seconds
const API_HEALTH_ENDPOINT = '/api/health';

export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null); // null = checking initially
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();
  const hasInitialCheckRun = useRef(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(API_HEALTH_ENDPOINT, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        setIsHealthy(data.status === 'ok');
      } else {
        setIsHealthy(false);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check - run immediately on mount
    if (!hasInitialCheckRun.current) {
      hasInitialCheckRun.current = true;
      checkHealth();
    }

    // Set up interval for periodic checks
    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);

    // Check on route change
    const handleRouteChange = () => {
      checkHealth();
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      clearInterval(interval);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  return {
    isHealthy,
    isChecking,
    checkNow: checkHealth,
  };
}

/**
 * Hook to handle API errors and optionally redirect to maintenance page
 */
export function useApiErrorHandler() {
  const router = useRouter();
  const [maintenanceNeeded, setMaintenanceNeeded] = useState(false);

  const handleApiError = async (
    error: any,
    options: { redirectToMaintenance?: boolean } = {}
  ) => {
    const { redirectToMaintenance = true } = options;

    // Check if it's a network/connection error
    if (
      error?.message?.includes('fetch') ||
      error?.code === 'ETIMEDOUT' ||
      error?.message?.includes('ECONNREFUSED')
    ) {
      setMaintenanceNeeded(true);

      if (redirectToMaintenance) {
        await router.push('/maintenance');
      }
      return;
    }

    // Check if response status is 503 (Service Unavailable)
    if (error?.status === 503) {
      setMaintenanceNeeded(true);

      if (redirectToMaintenance) {
        await router.push('/maintenance');
      }
      return;
    }

    throw error;
  };

  return {
    maintenanceNeeded,
    handleApiError,
    setMaintenanceNeeded,
  };
}
