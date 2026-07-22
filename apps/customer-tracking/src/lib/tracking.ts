export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  created: 'Creado',
  waiting_dispatch: 'Esperando despacho',
  searching_driver: 'Buscando repartidor',
  receiving_offers: 'Recibiendo ofertas',
  driver_selected: 'Repartidor asignado',
  driver_heading_to_store: 'En camino al local',
  driver_arrived_store: 'En el local',
  order_picked_up: 'Pedido recogido',
  heading_to_customer: 'En camino a ti',
  driver_arrived_customer: 'Ha llegado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  out_for_delivery: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export type PublicTracking = {
  valid: boolean;
  errorCode: string | null;
  orderNumber: string | null;
  orderStatus: string | null;
  deliveryStatus: string | null;
  merchantName: string | null;
  branchName: string | null;
  deliveryAddress: string | null;
  deliveryCommune: string | null;
  deliveryCity: string | null;
  deliveryPin: string | null;
  expiresAt: string | null;
  paymentMethod: string | null;
  total: number | null;
  amountToCollect: number | null;
  customerName: string | null;
  driverFirstName: string | null;
  branchLat: number | null;
  branchLng: number | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  driverLat: number | null;
  driverLng: number | null;
  driverRecordedAt: string | null;
  showDriverLocation: boolean;
};

type RpcRow = {
  valid: boolean;
  error_code: string | null;
  order_number: string | null;
  order_status: string | null;
  delivery_status: string | null;
  merchant_name: string | null;
  branch_name: string | null;
  delivery_address: string | null;
  delivery_commune: string | null;
  delivery_city: string | null;
  delivery_pin: string | null;
  expires_at: string | null;
  payment_method: string | null;
  total: number | string | null;
  amount_to_collect: number | string | null;
  customer_name: string | null;
  driver_first_name: string | null;
  branch_lat: number | null;
  branch_lng: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  driver_lat: number | null;
  driver_lng: number | null;
  driver_recorded_at: string | null;
  show_driver_location: boolean | null;
};

export function mapPublicTracking(row: RpcRow | null | undefined): PublicTracking {
  if (!row) {
    return {
      valid: false,
      errorCode: 'not_found',
      orderNumber: null,
      orderStatus: null,
      deliveryStatus: null,
      merchantName: null,
      branchName: null,
      deliveryAddress: null,
      deliveryCommune: null,
      deliveryCity: null,
      deliveryPin: null,
      expiresAt: null,
      paymentMethod: null,
      total: null,
      amountToCollect: null,
      customerName: null,
      driverFirstName: null,
      branchLat: null,
      branchLng: null,
      deliveryLat: null,
      deliveryLng: null,
      driverLat: null,
      driverLng: null,
      driverRecordedAt: null,
      showDriverLocation: false,
    };
  }

  return {
    valid: Boolean(row.valid),
    errorCode: row.error_code,
    orderNumber: row.order_number,
    orderStatus: row.order_status,
    deliveryStatus: row.delivery_status,
    merchantName: row.merchant_name,
    branchName: row.branch_name,
    deliveryAddress: row.delivery_address,
    deliveryCommune: row.delivery_commune,
    deliveryCity: row.delivery_city,
    deliveryPin: row.delivery_pin,
    expiresAt: row.expires_at,
    paymentMethod: row.payment_method,
    total: row.total != null ? Number(row.total) : null,
    amountToCollect: row.amount_to_collect != null ? Number(row.amount_to_collect) : null,
    customerName: row.customer_name,
    driverFirstName: row.driver_first_name,
    branchLat: row.branch_lat,
    branchLng: row.branch_lng,
    deliveryLat: row.delivery_lat,
    deliveryLng: row.delivery_lng,
    driverLat: row.driver_lat,
    driverLng: row.driver_lng,
    driverRecordedAt: row.driver_recorded_at,
    showDriverLocation: Boolean(row.show_driver_location),
  };
}

export function trackingErrorMessage(code: string | null): string {
  switch (code) {
    case 'expired':
      return 'Este enlace de seguimiento ya expiró.';
    case 'disabled':
      return 'El seguimiento público no está disponible en este momento.';
    case 'rate_limited':
      return 'Demasiadas consultas. Espera un momento e intenta de nuevo.';
    case 'invalid':
      return 'El código de seguimiento no es válido.';
    case 'not_found':
    default:
      return 'No encontramos un pedido con ese código.';
  }
}

/** Extrae el token de un UUID concatenado o de una URL /t/... */
export function normalizeTrackingToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  try {
    if (trimmed.includes('://') || trimmed.startsWith('/')) {
      const url = trimmed.includes('://')
        ? new URL(trimmed)
        : new URL(trimmed, 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean);
      const tIdx = parts.findIndex((p) => p === 't');
      const tokenPart = tIdx >= 0 ? parts[tIdx + 1] : undefined;
      if (tokenPart) {
        return tokenPart.replace(/[^a-fA-F0-9]/g, '');
      }
    }
  } catch {
    // ignore parse errors
  }

  return trimmed.replace(/[^a-fA-F0-9]/g, '');
}
