'use client';

import { Button } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { advanceDeliveryAction } from '@/app/(app)/delivery/actions';
import { DeliveryMap } from '@/components/delivery/delivery-map';
import { AvailabilityPanel } from '@/components/gps/availability-panel';
import { startGpsWatcher, type GpsPosition } from '@/lib/gps';
import {
  DELIVERY_STATUS_LABELS,
  NEXT_DELIVERY_FOR_DRIVER,
  type ActiveDelivery,
} from '@/lib/delivery-constants';
import { setActiveDeliveryLock } from '@/lib/pwa/detect';

const ACTION_LABELS: Record<string, string> = {
  driver_heading_to_store: 'Voy al local',
  driver_arrived_store: 'Llegué al local',
  order_picked_up: 'Pedido recogido',
  heading_to_customer: 'Voy al cliente',
  driver_arrived_customer: 'Llegué al cliente',
  delivered: 'Entregado',
};

const GEOFENCE_STATUSES = new Set([
  'driver_arrived_store',
  'driver_arrived_customer',
  'delivered',
]);

export function ActiveDeliveryPanel({ delivery }: { delivery: ActiveDelivery }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingForce, setPendingForce] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsPosition | null>(null);
  const next = NEXT_DELIVERY_FOR_DRIVER[delivery.status] ?? [];

  useEffect(() => {
    setActiveDeliveryLock(true);
    const stop = startGpsWatcher({
      orderId: delivery.orderId,
      onPosition: setGps,
      onError: setError,
    });
    return () => {
      stop();
      setActiveDeliveryLock(false);
    };
  }, [delivery.orderId]);

  async function advance(status: string, force = false) {
    setBusy(true);
    setError(null);
    setPendingForce(null);
    const result = await advanceDeliveryAction(delivery.deliveryRequestId, status, {
      forceGeofence: force,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      if (GEOFENCE_STATUSES.has(status) && result.message.includes('geocerca')) {
        setPendingForce(status);
      }
      return;
    }
    if (status === 'delivered') {
      setActiveDeliveryLock(false);
    }
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{delivery.orderNumber}</h2>
        <p className="text-sm text-slate-600">
          {DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
        </p>
      </div>

      <AvailabilityPanel orderId={delivery.orderId} showMapHint={false} />

      <p className="text-sm text-slate-700">
        {delivery.merchantName} · {delivery.branchName}
      </p>
      <p className="text-sm text-slate-700">
        Cliente: {delivery.customerName} · {delivery.customerPhone}
      </p>
      <p className="text-sm text-slate-700">{delivery.deliveryAddress}</p>
      <DeliveryMap
        branchLat={delivery.branchLat}
        branchLng={delivery.branchLng}
        deliveryLat={delivery.deliveryLat}
        deliveryLng={delivery.deliveryLng}
        driverLat={gps?.latitude ?? null}
        driverLng={gps?.longitude ?? null}
        branchLabel={delivery.branchName}
        deliveryLabel="Cliente"
        height="260px"
      />
      {delivery.offeredPrice != null ? (
        <p className="text-sm font-medium text-slate-900">
          Tarifa: ${delivery.offeredPrice.toLocaleString('es-CL')}
        </p>
      ) : null}
      <p className="text-sm text-slate-600">
        Código retiro: <strong>{delivery.pickupCode}</strong> · PIN:{' '}
        <strong>{delivery.deliveryPin}</strong>
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {pendingForce ? (
        <Button
          type="button"
          variant="ghost"
          size="md"
          disabled={busy}
          onClick={() => advance(pendingForce, true)}
        >
          Confirmar de todos modos ({ACTION_LABELS[pendingForce]})
        </Button>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {next.map((status) => (
          <Button
            key={status}
            type="button"
            size="lg"
            disabled={busy}
            onClick={() => advance(status)}
          >
            {ACTION_LABELS[status] ?? status}
          </Button>
        ))}
      </div>
    </div>
  );
}
