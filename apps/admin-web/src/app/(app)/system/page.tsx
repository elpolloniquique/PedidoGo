import { getPlatformHealth } from '@/lib/system';
import { Alert } from '@pedidosgo/ui';

export default async function SystemHealthPage() {
  const health = await getPlatformHealth();

  if (!health) {
    return (
      <Alert variant="error">
        No se pudo cargar el estado de la plataforma. ¿Aplicaste la migración Fase 14?
      </Alert>
    );
  }

  const items = [
    { label: 'Solicitudes de repartidor pendientes', value: health.pendingDriverApplications },
    { label: 'Pagos de comisión pendientes', value: health.pendingCommissionPayments },
    { label: 'Entregas activas', value: health.activeDeliveries },
    { label: 'Pedidos buscando repartidor', value: health.openDeliveryJobs },
    {
      label: 'Tracking público',
      value: health.publicTrackingEnabled ? 'Activo' : 'Desactivado',
    },
    {
      label: 'Realtime notificaciones',
      value: health.notificationsRealtime ? 'OK' : 'Revisar',
    },
    { label: 'Buckets rate-limit (interno)', value: health.rateLimitBuckets },
  ];

  return (
    <div className="space-y-6 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Salud de la plataforma</h2>
        <p className="mt-1 text-sm text-slate-600">
          Resumen operativo para producción. Solo visible para administradores.
        </p>
      </div>

      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-slate-600">{item.label}</span>
            <strong className="text-slate-900">{item.value}</strong>
          </li>
        ))}
      </ul>

      <Alert variant="info">
        Endpoints de salud por app: <code>/api/health</code> en cada despliegue Vercel.
      </Alert>
    </div>
  );
}
