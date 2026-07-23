import { Alert, Surface } from '@pedidosgo/ui';
import { getAdminDashboardMetrics } from '@/lib/dashboard';

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-teal-900/10 bg-white/90 p-5 shadow-sm">
      <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-teal-800 uppercase">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{hint}</p> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const metrics = await getAdminDashboardMetrics();

  if (!metrics) {
    return (
      <Alert variant="error">
        No se pudieron cargar las métricas. ¿Aplicaste la migración Fase 19
        (`20260721000025_dashboards_cron_fase19.sql`)?
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <Surface>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          Dashboard
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Vista operativa de la plataforma en tiempo casi real.
        </p>
      </Surface>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Repartidores disponibles" value={metrics.driversAvailable} />
        <MetricCard label="Ocupados" value={metrics.driversBusy} />
        <MetricCard label="Desconectados" value={metrics.driversOffline} />
        <MetricCard label="Solicitudes pendientes" value={metrics.driversPending} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Pedidos activos" value={metrics.ordersActive} />
        <MetricCard label="Entregados hoy" value={metrics.ordersDeliveredToday} />
        <MetricCard label="Cancelados hoy" value={metrics.ordersCancelledToday} />
        <MetricCard label="Buscando repartidor" value={metrics.jobsSearching} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pagos comisión pendientes"
          value={metrics.commissionPending}
          hint={`$${metrics.commissionPendingAmount.toLocaleString('es-CL')}`}
        />
        <MetricCard label="Tickets abiertos" value={metrics.openSupportTickets} />
        <MetricCard label="Webhooks pendientes" value={metrics.webhooksPending} />
        <MetricCard
          label="Comercios activos"
          value={metrics.merchantsActive}
          hint={`Rating medio repartidores: ${metrics.avgDriverRating}`}
        />
      </div>
    </div>
  );
}
