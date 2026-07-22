'use client';

import { useActiveDeliveryRealtime } from '@/lib/realtime';

export function DeliveryRealtimeBridge({
  deliveryRequestId,
}: {
  deliveryRequestId: string;
}) {
  useActiveDeliveryRealtime(deliveryRequestId);
  return null;
}
