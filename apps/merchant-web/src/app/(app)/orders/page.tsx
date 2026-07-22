import { OrdersListRealtime } from '@/components/orders/orders-list-realtime';
import { listMerchantOrders, ORDER_STATUS_LABELS } from '@/lib/orders';
import { requireMerchantContext } from '@/lib/merchant';
import { Button } from '@pedidosgo/ui';
import Link from 'next/link';

export default async function OrdersPage() {
  const { merchant } = await requireMerchantContext();
  const orders = await listMerchantOrders();

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <OrdersListRealtime merchantId={merchant.id} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Pedidos</h2>
        <Link href="/orders/new">
          <Button size="md">Nuevo pedido</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-slate-600">Aún no hay pedidos. Crea el primero.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-slate-900">{o.orderNumber}</p>
                <p className="text-sm text-slate-600">
                  {o.customerName} · {ORDER_STATUS_LABELS[o.status]}
                </p>
                <p className="text-xs text-slate-500">{o.deliveryAddress}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${o.total.toLocaleString('es-CL')}</p>
                <Link href={`/orders/${o.id}`} className="text-sm text-teal-700 underline">
                  Ver
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
