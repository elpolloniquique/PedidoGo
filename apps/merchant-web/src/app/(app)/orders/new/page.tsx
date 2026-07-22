import { CreateOrderForm } from '@/components/orders/create-order-form';
import { listBranches, requireMerchantContext } from '@/lib/merchant';
import { Alert } from '@pedidosgo/ui';

export default async function NewOrderPage() {
  const { merchant } = await requireMerchantContext();
  const branches = await listBranches(merchant.id);
  const active = branches.filter((b) => b.isActive);

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Nuevo pedido</h2>
      {active.length === 0 ? (
        <Alert variant="error">Necesitas al menos una sucursal activa.</Alert>
      ) : (
        <CreateOrderForm branches={active} />
      )}
    </div>
  );
}
