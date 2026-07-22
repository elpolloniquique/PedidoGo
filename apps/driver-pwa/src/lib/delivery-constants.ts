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
  deliveryLat: number | null;
  deliveryLng: number | null;
  branchLat: number | null;
  branchLng: number | null;
};

export type ActiveDelivery = {
  deliveryRequestId: string;
  orderId: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  offeredPrice: number | null;
  pickupCode: string | null;
  deliveryPin: string | null;
  merchantName: string;
  branchName: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  branchLat: number | null;
  branchLng: number | null;
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  created: 'Creado',
  searching_driver: 'Buscando',
  receiving_offers: 'Ofertas abiertas',
  driver_selected: 'Asignado',
  driver_heading_to_store: 'Hacia el local',
  driver_arrived_store: 'En el local',
  order_picked_up: 'Recogido',
  heading_to_customer: 'Hacia el cliente',
  driver_arrived_customer: 'Con el cliente',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const NEXT_DELIVERY_FOR_DRIVER: Partial<Record<string, string[]>> = {
  driver_selected: ['driver_heading_to_store'],
  driver_heading_to_store: ['driver_arrived_store', 'order_picked_up'],
  driver_arrived_store: ['order_picked_up'],
  order_picked_up: ['heading_to_customer'],
  heading_to_customer: ['driver_arrived_customer', 'delivered'],
  driver_arrived_customer: ['delivered'],
};
