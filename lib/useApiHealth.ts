import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/router';

export function useApiHealth() {
  const router = useRouter();

  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === '1';

  const goToMaintenance = useCallback(() => {
    router.push('/maintenance').catch(() => {});
  }, [router]);

  useEffect(() => {
    if (maintenanceMode && router.pathname !== '/maintenance') {
      router.push('/maintenance').catch(() => {});
    } else if (!maintenanceMode && router.pathname === '/maintenance') {
      router.push('/').catch(() => {});
    }
  }, [maintenanceMode, router.pathname, router]);

  return {
    goToMaintenance,
    isManuallyEnabled: maintenanceMode,
  };
}

export function useApiErrorHandler() {
  const router = useRouter();
  const [maintenanceNeeded, setMaintenanceNeeded] = useState(false);

  const handleApiError = async (
    error: any,
    options: { redirectToMaintenance?: boolean } = {}
  ) => {
    const { redirectToMaintenance = true } = options;

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
