import { useState, useEffect } from 'react';
import { useApiHealth } from '../../lib/useApiHealth';

export default function MaintenanceAdminPage() {
  const { isManuallyEnabled } = useApiHealth();
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(isManuallyEnabled ? 'Maintenance mode is ENABLED' : 'Maintenance mode is DISABLED');
  }, [isManuallyEnabled]);

  return (
    <div className="admin-maintenance-page" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Maintenance Mode Control</h1>
      
      {message && (
        <div style={{ 
          padding: '0.75rem', 
          marginBottom: '1rem', 
          borderRadius: '4px',
          backgroundColor: isManuallyEnabled ? '#fee2e2' : '#dcfce7',
          color: isManuallyEnabled ? '#dc2626' : '#16a34a'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ marginBottom: '0.5rem' }}>
          Current Status: <strong>{isManuallyEnabled ? 'ENABLED' : 'DISABLED'}</strong>
        </p>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>
          Maintenance mode is controlled by the <code>NEXT_PUBLIC_MAINTENANCE_MODE</code> environment variable.
          Set it to <code>1</code> to enable maintenance mode.
        </p>
        <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Changing the env var and redeploying will update the maintenance status.
        </p>
      </div>
    </div>
  );
}
