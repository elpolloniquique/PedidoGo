import { ActiveDeliveryPanel } from '@/components/delivery/active-delivery-panel';
import { DeliveryRealtimeBridge } from '@/components/delivery/delivery-realtime-bridge';
import { countDeliveryEvidence, getMyActiveDelivery } from '@/lib/delivery';
import { requireDriver } from '@/lib/driver';
import { Alert } from '@pedidosgo/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DeliveryPage() {
  const { driver } = await requireDriver();
  if (driver.status !== 'approved') {
    redirect('/');
  }

  const delivery = await getMyActiveDelivery();

  if (!delivery) {
    return (
      <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Entrega activa</h2>
        <Alert variant="info">No tienes una entrega en curso.</Alert>
        <Link href="/jobs" className="text-sm text-teal-700 underline">
          Ver pedidos disponibles
        </Link>
      </div>
    );
  }

  const evidenceCount = await countDeliveryEvidence(delivery.deliveryRequestId);

  return (
    <>
      <DeliveryRealtimeBridge deliveryRequestId={delivery.deliveryRequestId} />
      <ActiveDeliveryPanel delivery={delivery} evidenceCount={evidenceCount} />
    </>
  );
}
