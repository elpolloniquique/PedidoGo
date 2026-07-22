export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type DeliveryStatus =
  | 'created'
  | 'waiting_dispatch'
  | 'searching_driver'
  | 'receiving_offers'
  | 'driver_selected'
  | 'driver_heading_to_store'
  | 'driver_near_store'
  | 'driver_arrived_store'
  | 'order_preparing'
  | 'order_ready'
  | 'order_picked_up'
  | 'heading_to_customer'
  | 'driver_near_customer'
  | 'driver_arrived_customer'
  | 'delivery_verification'
  | 'delivered'
  | 'cancelled'
  | 'incident'
  | 'failed_delivery'
  | 'returned';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  out_for_delivery: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  created: 'Creado',
  waiting_dispatch: 'Esperando despacho',
  searching_driver: 'Buscando repartidor',
  receiving_offers: 'Recibiendo ofertas',
  driver_selected: 'Repartidor asignado',
  driver_heading_to_store: 'Hacia el local',
  driver_arrived_store: 'En el local',
  order_picked_up: 'Pedido recogido',
  heading_to_customer: 'Hacia el cliente',
  driver_arrived_customer: 'Con el cliente',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const NEXT_ORDER_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed', 'preparing', 'cancelled'],
  confirmed: ['preparing', 'ready', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
};

export const NEXT_DELIVERY_STATUSES: Partial<Record<string, string[]>> = {
  driver_selected: ['driver_heading_to_store'],
  driver_heading_to_store: ['driver_arrived_store', 'order_picked_up'],
  driver_arrived_store: ['order_picked_up'],
  order_picked_up: ['heading_to_customer'],
  heading_to_customer: ['driver_arrived_customer', 'delivered'],
  driver_arrived_customer: ['delivered'],
};

export type OrderListItem = {
  id: string;
  orderNumber: string;
  branchId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
};

export type OrderItemRecord = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
};

export type DeliveryOfferRecord = {
  id: string;
  driverId: string;
  offeredPrice: number;
  estimatedMinutes: number | null;
  message: string | null;
  status: string;
  createdAt: string;
  driverName: string | null;
};

export type OrderDetail = OrderListItem & {
  deliveryCommune: string | null;
  deliveryCity: string | null;
  deliveryApartment: string | null;
  deliveryReferences: string | null;
  subtotal: number;
  deliveryFee: number;
  paymentMethod: string;
  amountToCollect: number;
  notes: string | null;
  items: OrderItemRecord[];
  deliveryRequest: {
    id: string;
    status: string;
    dispatchMode: string;
    fixedFare: number | null;
    offerDeadlineAt: string | null;
    publishedAt: string | null;
  } | null;
  offers: DeliveryOfferRecord[];
  assignment: {
    driverId: string;
    pickupCode: string | null;
    deliveryPin: string | null;
    trackingToken: string | null;
    trackingTokenExpiresAt: string | null;
  } | null;
};

export type OpenDeliveryJob = {
  deliveryRequestId: string;
  orderId: string;
  orderNumber: string;
  branchName: string;
  merchantName: string;
  deliveryCommune: string | null;
  deliveryCity: string | null;
  deliveryAddress: string;
  subtotal: number;
  fixedFare: number | null;
  dispatchMode: string;
  status: string;
  offerDeadlineAt: string | null;
  publishedAt: string | null;
  myOfferPrice: number | null;
  myOfferStatus: string | null;
};
