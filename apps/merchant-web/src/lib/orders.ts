import { createClient } from './supabase/server';
import { requireMerchantContext } from './merchant';
import type {
  DeliveryOfferRecord,
  OrderDetail,
  OrderItemRecord,
  OrderListItem,
  OrderStatus,
} from './order-constants';

export type {
  DeliveryOfferRecord,
  OrderDetail,
  OrderItemRecord,
  OrderListItem,
  OrderStatus,
} from './order-constants';

export {
  DELIVERY_STATUS_LABELS,
  NEXT_DELIVERY_STATUSES,
  NEXT_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from './order-constants';

export async function listMerchantOrders(): Promise<OrderListItem[]> {
  const { merchant } = await requireMerchantContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from('orders')
    .select(
      'id, order_number, branch_id, customer_name, customer_phone, delivery_address, status, total, created_at',
    )
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    branchId: row.branch_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    status: row.status as OrderStatus,
    total: Number(row.total),
    createdAt: row.created_at,
  }));
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const { merchant } = await requireMerchantContext();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_number, merchant_id, branch_id, customer_name, customer_phone, delivery_address, delivery_commune, delivery_city, delivery_apartment, delivery_references, subtotal, delivery_fee, total, payment_method, amount_to_collect, status, notes, created_at',
    )
    .eq('id', orderId)
    .maybeSingle();

  if (!order || order.merchant_id !== merchant.id) {
    return null;
  }

  const [{ data: items }, { data: request }] = await Promise.all([
    supabase
      .from('order_items')
      .select('id, product_name, quantity, unit_price, total_price, notes')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }),
    supabase
      .from('delivery_requests')
      .select(
        'id, status, dispatch_mode, fixed_fare, offer_deadline_at, published_at',
      )
      .eq('order_id', orderId)
      .maybeSingle(),
  ]);

  const requestId = request?.id;
  let filteredOffers: {
    id: string;
    driver_id: string;
    offered_price: number;
    estimated_minutes: number | null;
    message: string | null;
    status: string;
    created_at: string;
  }[] = [];

  if (requestId) {
    const { data: offers } = await supabase
      .from('delivery_offers')
      .select(
        'id, driver_id, offered_price, estimated_minutes, message, status, created_at',
      )
      .eq('delivery_request_id', requestId)
      .order('created_at', { ascending: false });
    filteredOffers = offers ?? [];
  }

  let assignment: OrderDetail['assignment'] = null;
  if (requestId) {
    const { data: asn } = await supabase
      .from('delivery_assignments')
      .select('driver_id, pickup_code, delivery_pin, tracking_token, tracking_token_expires_at')
      .eq('delivery_request_id', requestId)
      .maybeSingle();
    if (asn) {
      assignment = {
        driverId: asn.driver_id,
        pickupCode: asn.pickup_code,
        deliveryPin: asn.delivery_pin,
        trackingToken: asn.tracking_token,
        trackingTokenExpiresAt: asn.tracking_token_expires_at,
      };
    }
  }

  const offerRecords: DeliveryOfferRecord[] = filteredOffers.map((o) => ({
    id: o.id,
    driverId: o.driver_id,
    offeredPrice: Number(o.offered_price),
    estimatedMinutes: o.estimated_minutes,
    message: o.message,
    status: o.status,
    createdAt: o.created_at,
    driverName: null,
  }));

  return {
    id: order.id,
    orderNumber: order.order_number,
    branchId: order.branch_id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    deliveryAddress: order.delivery_address,
    deliveryCommune: order.delivery_commune,
    deliveryCity: order.delivery_city,
    deliveryApartment: order.delivery_apartment,
    deliveryReferences: order.delivery_references,
    status: order.status as OrderStatus,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total),
    paymentMethod: order.payment_method,
    amountToCollect: Number(order.amount_to_collect),
    notes: order.notes,
    createdAt: order.created_at,
    items: (items ?? []).map(
      (i): OrderItemRecord => ({
        id: i.id,
        productName: i.product_name,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unit_price),
        totalPrice: Number(i.total_price),
        notes: i.notes,
      }),
    ),
    deliveryRequest: request
      ? {
          id: request.id,
          status: request.status,
          dispatchMode: request.dispatch_mode,
          fixedFare: request.fixed_fare != null ? Number(request.fixed_fare) : null,
          offerDeadlineAt: request.offer_deadline_at,
          publishedAt: request.published_at,
        }
      : null,
    offers: offerRecords,
    assignment,
  };
}

export async function getOrderMapPoints(orderId: string): Promise<{
  deliveryLat: number | null;
  deliveryLng: number | null;
  branchLat: number | null;
  branchLng: number | null;
  branchName: string | null;
  deliveryAddress: string | null;
} | null> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_order_map_points', { p_order_id: orderId });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    deliveryLat: row.delivery_lat != null ? Number(row.delivery_lat) : null,
    deliveryLng: row.delivery_lng != null ? Number(row.delivery_lng) : null,
    branchLat: row.branch_lat != null ? Number(row.branch_lat) : null,
    branchLng: row.branch_lng != null ? Number(row.branch_lng) : null,
    branchName: row.branch_name ?? null,
    deliveryAddress: row.delivery_address ?? null,
  };
}

export async function getOrderDriverLocation(orderId: string): Promise<{
  driverId: string;
  lat: number;
  lng: number;
  recordedAt: string | null;
} | null> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_order_driver_location', {
    p_order_id: orderId,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.lat || !row?.lng) return null;
  return {
    driverId: row.driver_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    recordedAt: row.recorded_at ?? null,
  };
}

export async function getOrderRating(orderId: string): Promise<{
  ratingId: string;
  score: number;
  comment: string | null;
  createdAt: string;
  averageRating: number | null;
} | null> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_order_rating', { p_order_id: orderId });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.rating_id) return null;
  return {
    ratingId: row.rating_id,
    score: Number(row.score),
    comment: row.comment ?? null,
    createdAt: row.created_at,
    averageRating: row.average_rating != null ? Number(row.average_rating) : null,
  };
}
