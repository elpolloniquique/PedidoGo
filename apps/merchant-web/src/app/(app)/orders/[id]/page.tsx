import { DriverRatingPanel } from '@/components/orders/driver-rating-panel';
import { OrderActionsPanel } from '@/components/orders/order-actions-panel';
import { OrderMapPanel } from '@/components/orders/order-map-panel';
import {
  getOrderDetail,
  getOrderDriverLocation,
  getOrderMapPoints,
  getOrderRating,
  ORDER_STATUS_LABELS,
} from '@/lib/orders';
import { Alert } from '@pedidosgo/ui';
import { notFound } from 'next/navigation';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();
  const [mapPoints, driverLoc, rating] = await Promise.all([
    getOrderMapPoints(id),
    getOrderDriverLocation(id),
    getOrderRating(id),
  ]);

  return (
    <div className="space-y-6 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{order.orderNumber}</h2>
        <p className="text-sm text-slate-600">
          {ORDER_STATUS_LABELS[order.status]} · ${order.total.toLocaleString('es-CL')}
        </p>
      </div>

      <Alert variant="info">
        {order.customerName} · {order.customerPhone}
        <br />
        {order.deliveryAddress}
        {order.deliveryCommune ? `, ${order.deliveryCommune}` : ''}
        {order.deliveryCity ? `, ${order.deliveryCity}` : ''}
      </Alert>

      <div>
        <h3 className="mb-2 font-semibold text-slate-900">Mapa</h3>
        {mapPoints ? (
          <OrderMapPanel
            points={mapPoints}
            orderId={id}
            deliveryRequestId={order.deliveryRequest?.id}
            driverId={order.assignment?.driverId ?? driverLoc?.driverId}
            initialDriver={
              driverLoc
                ? {
                    lat: driverLoc.lat,
                    lng: driverLoc.lng,
                    recordedAt: driverLoc.recordedAt,
                  }
                : null
            }
          />
        ) : null}
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-slate-900">Ítems</h3>
        <ul className="space-y-1 text-sm text-slate-700">
          {order.items.map((item) => (
            <li key={item.id}>
              {item.quantity} × {item.productName} — $
              {item.totalPrice.toLocaleString('es-CL')}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-slate-600">
          Subtotal ${order.subtotal.toLocaleString('es-CL')} · Delivery $
          {order.deliveryFee.toLocaleString('es-CL')}
        </p>
      </div>

      {order.status === 'delivered' && order.assignment ? (
        <DriverRatingPanel
          orderId={id}
          existingScore={rating?.score ?? null}
          existingComment={rating?.comment ?? null}
          averageRating={rating?.averageRating ?? null}
        />
      ) : null}

      <OrderActionsPanel order={order} />
    </div>
  );
}
