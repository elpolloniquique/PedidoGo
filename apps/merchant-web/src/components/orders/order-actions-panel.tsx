'use client';

import { Button } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  acceptOfferAction,
  publishDeliveryAction,
  updateOrderStatusAction,
} from '@/app/(app)/orders/actions';
import { TrackingLinkCard } from '@/components/orders/tracking-link-card';
import {
  DELIVERY_STATUS_LABELS,
  NEXT_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderDetail,
  type OrderStatus,
} from '@/lib/order-constants';

export function OrderActionsPanel({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const next = NEXT_ORDER_STATUSES[order.status] ?? [];

  async function run(key: string, fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(key);
    setError(null);
    setMessage(null);
    const result = await fn();
    setBusy(null);
    if (!result.ok) {
      setError(result.message ?? 'Error');
      return;
    }
    setMessage(result.message ?? 'OK');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div>
        <p className="mb-2 text-sm text-slate-600">
          Estado del pedido:{' '}
          <strong>{ORDER_STATUS_LABELS[order.status] ?? order.status}</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          {next.map((status) => (
            <Button
              key={status}
              type="button"
              size="md"
              variant={status === 'cancelled' ? 'ghost' : 'secondary'}
              disabled={busy !== null}
              onClick={() =>
                run(`status-${status}`, () =>
                  updateOrderStatusAction(order.id, status as OrderStatus),
                )
              }
            >
              → {ORDER_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
      </div>

      {order.deliveryRequest ? (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-600">
            Delivery:{' '}
            <strong>
              {DELIVERY_STATUS_LABELS[order.deliveryRequest.status] ??
                order.deliveryRequest.status}
            </strong>{' '}
            · modo {order.deliveryRequest.dispatchMode}
          </p>
          {['created', 'waiting_dispatch'].includes(order.deliveryRequest.status) ||
          (!order.deliveryRequest.publishedAt &&
            !['driver_selected', 'delivered', 'cancelled'].includes(
              order.deliveryRequest.status,
            )) ? (
            <Button
              type="button"
              size="md"
              className="mt-3"
              disabled={busy !== null}
              onClick={() => run('publish', () => publishDeliveryAction(order.id))}
            >
              Publicar a repartidores
            </Button>
          ) : null}
        </div>
      ) : null}

      {order.offers.length > 0 ? (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900">Ofertas</h3>
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {order.offers.map((offer) => (
              <li
                key={offer.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="text-sm">
                  <p className="font-medium text-slate-900">
                    ${offer.offeredPrice.toLocaleString('es-CL')}
                    {offer.estimatedMinutes ? ` · ~${offer.estimatedMinutes} min` : ''}
                  </p>
                  <p className="text-slate-500">
                    {offer.status}
                    {offer.message ? ` · ${offer.message}` : ''}
                  </p>
                </div>
                {offer.status === 'pending' &&
                order.deliveryRequest &&
                ['receiving_offers', 'searching_driver'].includes(
                  order.deliveryRequest.status,
                ) ? (
                  <Button
                    type="button"
                    size="md"
                    disabled={busy !== null}
                    onClick={() =>
                      run(`offer-${offer.id}`, () => acceptOfferAction(offer.id, order.id))
                    }
                  >
                    Aceptar
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {order.assignment ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-sm">
          <p>
            Repartidor asignado. Código retiro:{' '}
            <strong>{order.assignment.pickupCode}</strong>
          </p>
          <p>
            PIN entrega: <strong>{order.assignment.deliveryPin}</strong>
          </p>
          {order.assignment.trackingToken ? (
            <TrackingLinkCard
              token={order.assignment.trackingToken}
              expiresAt={order.assignment.trackingTokenExpiresAt}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
