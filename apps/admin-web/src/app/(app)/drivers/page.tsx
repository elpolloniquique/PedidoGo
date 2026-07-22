import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Alert, Button } from '@pedidosgo/ui';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  under_review: 'En revisión',
  changes_required: 'Correcciones',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  suspended: 'Suspendida',
  blocked: 'Bloqueada',
  expired: 'Expirada',
};

export default async function DriversListPage() {
  await requireAppUser();
  const supabase = await createClient();

  const { data: drivers, error } = await supabase
    .from('drivers')
    .select(
      'id, rut, status, city, commune, created_at, profiles:user_id ( email, first_name, last_name )',
    )
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Solicitudes de repartidores</h2>
        <Link href="/">
          <Button variant="ghost">Volver</Button>
        </Link>
      </div>

      {error ? <Alert variant="error">{error.message}</Alert> : null}

      {!drivers?.length ? (
        <Alert variant="info">No hay repartidores registrados todavía.</Alert>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Correo</th>
                <th className="px-3 py-2 font-medium">RUT</th>
                <th className="px-3 py-2 font-medium">Ciudad</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {drivers.map((row) => {
                const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                return (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-3 py-3">{profile?.email ?? '—'}</td>
                    <td className="px-3 py-3">{row.rut ?? '—'}</td>
                    <td className="px-3 py-3">
                      {[row.commune, row.city].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-3 py-3">
                      {STATUS_LABELS[row.status] ?? row.status}
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/drivers/${row.id}`}>
                        <Button size="md" variant="secondary">
                          Revisar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
