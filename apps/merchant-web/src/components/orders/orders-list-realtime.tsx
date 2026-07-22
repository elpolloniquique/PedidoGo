'use client';

import { useMerchantOrdersRealtime } from '@/lib/realtime';

export function OrdersListRealtime({ merchantId }: { merchantId: string }) {
  useMerchantOrdersRealtime(merchantId);
  return null;
}
