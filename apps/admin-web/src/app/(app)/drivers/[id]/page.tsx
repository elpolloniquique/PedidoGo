import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ReviewActions } from '@/components/drivers/review-actions';
import { Alert, Button } from '@pedidosgo/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  under_review: 'En revisión',
  changes_required: 'Correcciones requeridas',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  suspended: 'Suspendida',
  blocked: 'Bloqueada',
  expired: 'Expirada',
};

const DOC_LABELS: Record<string, string> = {
  id_front: 'Cédula frontal',
  id_back: 'Cédula posterior',
  license: 'Licencia',
  circulation_permit: 'Permiso circulación',
  mandatory_insurance: 'Seguro obligatorio',
  technical_review: 'Revisión técnica',
  other: 'Otro',
};

type PageProps = { params: Promise<{ id: string }> };

export default async function DriverDetailPage({ params }: PageProps) {
  await requireAppUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: driver } = await supabase
    .from('drivers')
    .select(
      'id, rut, status, region, city, commune, address_line, emergency_contact_name, emergency_contact_phone, birth_date, approved_at, profiles:user_id ( email, first_name, last_name, phone )',
    )
    .eq('id', id)
    .maybeSingle();

  if (!driver) notFound();

  const profile = Array.isArray(driver.profiles) ? driver.profiles[0] : driver.profiles;

  const [{ data: documents }, { data: vehicles }, { data: applications }] = await Promise.all([
    supabase
      .from('driver_documents')
      .select('id, document_type, storage_path, status, rejection_reason, created_at')
      .eq('driver_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('driver_vehicles')
      .select('id, vehicle_type, brand, model, year, color, license_plate, is_primary')
      .eq('driver_id', id),
    supabase
      .from('driver_applications')
      .select('id, status, reviewer_notes, reviewed_at, submitted_at, created_at')
      .eq('driver_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">
          {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Repartidor'}
        </h2>
        <Link href="/drivers">
          <Button variant="ghost">Volver al listado</Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm space-y-3">
        <Alert variant={driver.status === 'approved' ? 'success' : 'info'}>
          Estado: <strong>{STATUS_LABELS[driver.status] ?? driver.status}</strong>
        </Alert>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Correo</dt>
            <dd>{profile?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Teléfono</dt>
            <dd>{profile?.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">RUT</dt>
            <dd>{driver.rut ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Nacimiento</dt>
            <dd>{driver.birth_date ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Dirección</dt>
            <dd>
              {[driver.address_line, driver.commune, driver.city, driver.region]
                .filter(Boolean)
                .join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Emergencia</dt>
            <dd>
              {driver.emergency_contact_name ?? '—'} · {driver.emergency_contact_phone ?? '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm space-y-3">
        <h3 className="font-semibold text-slate-900">Documentos</h3>
        {!documents?.length ? (
          <p className="text-sm text-slate-500">Sin documentos.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {documents.map((doc) => (
              <li key={doc.id} className="flex justify-between gap-3 py-2">
                <span>{DOC_LABELS[doc.document_type] ?? doc.document_type}</span>
                <span className="text-slate-500">{doc.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm space-y-3">
        <h3 className="font-semibold text-slate-900">Vehículos</h3>
        {!vehicles?.length ? (
          <p className="text-sm text-slate-500">Sin vehículos.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {vehicles.map((v) => (
              <li key={v.id}>
                {v.vehicle_type} · {v.brand} {v.model} ({v.year}) · {v.color} · {v.license_plate}
                {v.is_primary ? ' · principal' : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm space-y-3">
        <h3 className="font-semibold text-slate-900">Historial de revisión</h3>
        {!applications?.length ? (
          <p className="text-sm text-slate-500">Sin envíos todavía.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {applications.map((app) => (
              <li key={app.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <div>
                  {STATUS_LABELS[app.status] ?? app.status}
                  {app.reviewed_at ? ` · revisado ${new Date(app.reviewed_at).toLocaleString('es-CL')}` : ''}
                </div>
                {app.reviewer_notes ? (
                  <div className="text-slate-600">{app.reviewer_notes}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-900">Acciones</h3>
        <ReviewActions driverId={driver.id} />
      </div>
    </div>
  );
}
