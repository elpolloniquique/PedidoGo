'use client';

import { Button } from '@pedidosgo/ui';
import { useEffect, useState } from 'react';
import {
  getAvailabilityAction,
  setAvailabilityAction,
  type AvailabilitySnapshot,
} from '@/app/(app)/gps/actions';
import { startGpsWatcher, type GpsPosition } from '@/lib/gps';

const STATUS_LABEL: Record<string, string> = {
  available: 'En línea',
  busy: 'En entrega',
  offline: 'Offline',
};

export function AvailabilityPanel({
  orderId,
  showMapHint = true,
}: {
  orderId?: string | null;
  showMapHint?: boolean;
}) {
  const [snapshot, setSnapshot] = useState<AvailabilitySnapshot | null>(null);
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  async function refresh() {
    const data = await getAvailabilityAction();
    setSnapshot(data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!tracking) return;
    setError(null);
    const stop = startGpsWatcher({
      orderId: orderId ?? null,
      onPosition: setPosition,
      onError: setError,
      onUploaded: () => setLastUpload(new Date().toLocaleTimeString('es-CL')),
    });
    return stop;
  }, [tracking, orderId]);

  async function toggleOnline() {
    setBusy(true);
    setError(null);
    const next = snapshot?.status === 'available' ? 'offline' : 'available';
    const result = await setAvailabilityAction(next);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (next === 'available') setTracking(true);
    if (next === 'offline') setTracking(false);
    await refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Estado GPS</p>
          <p className="text-xs text-slate-600">
            {STATUS_LABEL[snapshot?.status ?? 'offline'] ?? 'Offline'}
            {tracking ? ' · enviando ubicación' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="md"
            variant={tracking ? 'secondary' : 'ghost'}
            onClick={() => setTracking((v) => !v)}
          >
            {tracking ? 'Pausar GPS' : 'Activar GPS'}
          </Button>
          {snapshot?.status !== 'busy' ? (
            <Button type="button" size="md" disabled={busy} onClick={toggleOnline}>
              {snapshot?.status === 'available' ? 'Pasar a offline' : 'Ponerme en línea'}
            </Button>
          ) : null}
        </div>
      </div>

      {position ? (
        <p className="text-xs text-slate-600">
          Posición: {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
          {position.accuracy != null ? ` (±${Math.round(position.accuracy)} m)` : ''}
          {lastUpload ? ` · enviado ${lastUpload}` : ''}
        </p>
      ) : showMapHint ? (
        <p className="text-xs text-slate-500">
          Activa el GPS para aparecer cerca de los comercios y validar geocercas.
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
