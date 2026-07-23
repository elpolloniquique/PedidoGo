import { Surface } from '@pedidosgo/ui';
import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function ReportsPage() {
  await requireAppUser();
  const supabase = await createClient();

  const [orders, drivers, payments] = await Promise.all([
    supabase.rpc('export_admin_orders_report', { p_days: 30 }),
    supabase.rpc('export_admin_drivers_report'),
    supabase.rpc('export_admin_payments_report', { p_days: 90 }),
  ]);

  const orderCount = Array.isArray(orders.data) ? orders.data.length : 0;
  const driverCount = Array.isArray(drivers.data) ? drivers.data.length : 0;
  const paymentCount = Array.isArray(payments.data) ? payments.data.length : 0;

  const err =
    orders.error?.message || drivers.error?.message || payments.error?.message || null;

  return (
    <div className="space-y-5">
      <Surface>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          Reportes
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Exportá CSV de pedidos (30 días), repartidores y pagos (90 días). Máximo 5.000 filas
          por reporte.
        </p>
        {err ? (
          <p className="mt-3 text-sm text-red-700">
            No se pudieron cargar conteos ({err}). ¿Aplicaste la migración Fase 21?
          </p>
        ) : null}
      </Surface>

      <div className="grid gap-4 sm:grid-cols-3">
        <ReportCard title="Pedidos" count={orderCount} href="/api/reports/orders.csv" />
        <ReportCard title="Repartidores" count={driverCount} href="/api/reports/drivers.csv" />
        <ReportCard title="Pagos" count={paymentCount} href="/api/reports/payments.csv" />
      </div>
    </div>
  );
}

function ReportCard({
  title,
  count,
  href,
}: {
  title: string;
  count: number;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-teal-900/10 bg-white/90 p-5 shadow-sm">
      <h3 className="font-semibold text-[var(--color-ink)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{count} filas</p>
      <a
        href={href}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-brand-600)] px-4 text-sm font-semibold text-white"
      >
        Descargar CSV
      </a>
    </div>
  );
}
