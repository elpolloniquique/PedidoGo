import { OfferForm } from '@/components/delivery/offer-form';
import { DeliveryMap } from '@/components/delivery/delivery-map';
import { JobsRealtimeBridge } from '@/components/delivery/jobs-realtime-bridge';
import { listOpenJobs, DELIVERY_STATUS_LABELS } from '@/lib/delivery';
import { requireDriver } from '@/lib/driver';
import { Alert } from '@pedidosgo/ui';
import { redirect } from 'next/navigation';

export default async function JobsPage() {
  const { driver } = await requireDriver();
  if (driver.status !== 'approved') {
    redirect('/');
  }

  const jobs = await listOpenJobs();

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <JobsRealtimeBridge enabled />
      <h2 className="text-xl font-semibold text-slate-900">Pedidos disponibles</h2>
      <Alert variant="info">
        Oferta tu tarifa. La lista se actualiza en vivo cuando hay pedidos nuevos o cambios.
      </Alert>

      {jobs.length === 0 ? (
        <p className="text-sm text-slate-600">No hay pedidos abiertos ahora.</p>
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li key={job.deliveryRequestId} className="rounded-xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">
                {job.orderNumber} · {job.merchantName}
              </p>
              <p className="text-sm text-slate-600">{job.branchName}</p>
              <p className="text-sm text-slate-700">{job.deliveryAddress}</p>
              <p className="mt-1 text-xs text-slate-500">
                {DELIVERY_STATUS_LABELS[job.status] ?? job.status}
                {job.fixedFare != null
                  ? ` · tarifa fija $${job.fixedFare.toLocaleString('es-CL')}`
                  : ''}
                {job.myOfferStatus
                  ? ` · tu oferta: $${job.myOfferPrice?.toLocaleString('es-CL')} (${job.myOfferStatus})`
                  : ''}
              </p>
              <div className="mt-3">
                <DeliveryMap
                  branchLat={job.branchLat}
                  branchLng={job.branchLng}
                  deliveryLat={job.deliveryLat}
                  deliveryLng={job.deliveryLng}
                  branchLabel={job.branchName}
                  deliveryLabel="Cliente"
                  height="200px"
                />
              </div>
              <OfferForm job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
