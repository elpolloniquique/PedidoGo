'use client';

import { useEffect, useState } from 'react';
import { Alert } from '@pedidosgo/ui';
import { getPendingActions, offlineGet } from '@/lib/pwa/offline';

export function OfflineStatusBanner() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [cachedStatus, setCachedStatus] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    void (async () => {
      const actions = await getPendingActions();
      setPending(actions.length);
      const profile = await offlineGet<{ status?: string }>('driver_profile');
      setCachedStatus(profile?.status ?? null);
    })();

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (online) return null;

  return (
    <div className="mb-4">
      <Alert variant="error">
        Sin conexión. Modo offline limitado activo
        {cachedStatus ? ` · último estado: ${cachedStatus}` : ''}
        {pending > 0 ? ` · ${pending} acción(es) pendientes` : ''}.
        No se pueden confirmar pagos ni aceptar pedidos vencidos sin validación.
      </Alert>
    </div>
  );
}
