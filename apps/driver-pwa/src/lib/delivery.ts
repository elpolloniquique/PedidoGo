import { createClient } from './supabase/server';
import { requireDriver } from './driver';
import type { ActiveDelivery, OpenDeliveryJob } from './delivery-constants';

export type { ActiveDelivery, OpenDeliveryJob } from './delivery-constants';
export {
  DELIVERY_STATUS_LABELS,
  NEXT_DELIVERY_FOR_DRIVER,
} from './delivery-constants';

function num(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function listOpenJobs(): Promise<OpenDeliveryJob[]> {
  await requireDriver();
  const supabase = await createClient();
  const { data } = await supabase.rpc('list_open_delivery_jobs');

  return (data ?? []).map(
    (row: Record<string, unknown>) => ({
      deliveryRequestId: row.delivery_request_id as string,
      orderId: row.order_id as string,
      orderNumber: row.order_number as string,
      branchName: row.branch_name as string,
      merchantName: row.merchant_name as string,
      deliveryCommune: (row.delivery_commune as string | null) ?? null,
      deliveryCity: (row.delivery_city as string | null) ?? null,
      deliveryAddress: row.delivery_address as string,
      subtotal: Number(row.subtotal),
      fixedFare: num(row.fixed_fare),
      dispatchMode: row.dispatch_mode as string,
      status: row.status as string,
      offerDeadlineAt: (row.offer_deadline_at as string | null) ?? null,
      publishedAt: (row.published_at as string | null) ?? null,
      myOfferPrice: num(row.my_offer_price),
      myOfferStatus: (row.my_offer_status as string | null) ?? null,
      deliveryLat: num(row.delivery_lat),
      deliveryLng: num(row.delivery_lng),
      branchLat: num(row.branch_lat),
      branchLng: num(row.branch_lng),
    }),
  );
}

export async function getMyActiveDelivery(): Promise<ActiveDelivery | null> {
  await requireDriver();
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_my_active_delivery');
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    deliveryRequestId: row.delivery_request_id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    status: row.status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    offeredPrice: num(row.offered_price),
    pickupCode: row.pickup_code,
    deliveryPin: row.delivery_pin,
    merchantName: row.merchant_name,
    branchName: row.branch_name,
    deliveryLat: num(row.delivery_lat),
    deliveryLng: num(row.delivery_lng),
    branchLat: num(row.branch_lat),
    branchLng: num(row.branch_lng),
  };
}
