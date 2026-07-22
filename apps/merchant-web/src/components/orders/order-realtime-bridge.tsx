'use client';

import { useOrderRealtime } from '@/lib/realtime';

/** Montar en páginas de detalle de pedido para refrescar RSC vía Realtime. */
export function OrderRealtimeBridge({
  orderId,
  deliveryRequestId,
  driverId,
}: {
  orderId: string;
  deliveryRequestId?: string | null;
  driverId?: string | null;
}) {
  useOrderRealtime({
    orderId,
    deliveryRequestId,
    driverId,
    refreshOnChange: true,
  });
  return null;
}
