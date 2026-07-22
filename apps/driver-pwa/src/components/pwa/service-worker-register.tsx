'use client';

import { useEffect, useState } from 'react';
import { Alert, Button } from '@pedidosgo/ui';
import { hasActiveDeliveryLock } from '@/lib/pwa/detect';

/**
 * Registra el service worker y ofrece actualizar sin forzar
 * durante un pedido/entrega activo.
 */
export function ServiceWorkerRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg;
        if (reg.waiting) setWaiting(reg.waiting);

        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              setWaiting(reg.waiting);
            }
          });
        });
      })
      .catch(() => {
        // SW opcional en desarrollo / HTTP local limitado
      });

    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      void registration;
    };
  }, []);

  function applyUpdate() {
    if (hasActiveDeliveryLock()) return;
    waiting?.postMessage({ type: 'SKIP_WAITING' });
  }

  if (!waiting) return null;

  const blocked = hasActiveDeliveryLock();

  return (
    <div className="mb-4">
      <Alert variant="info">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {blocked
              ? 'Hay una nueva versión disponible. Se aplicará cuando termines la entrega en curso.'
              : 'Hay una nueva versión disponible.'}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="md"
              disabled={blocked}
              onClick={applyUpdate}
            >
              Actualizar ahora
            </Button>
            <Button type="button" size="md" variant="ghost" onClick={() => setWaiting(null)}>
              Después
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}
