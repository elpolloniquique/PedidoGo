import { Alert } from '@pedidosgo/ui';
import { SubmitApplicationButton } from '@/components/driver/submit-application-button';
import {
  canEditApplication,
  getDriverDocuments,
  getDriverVehicles,
  requireDriver,
  STATUS_LABELS,
} from '@/lib/driver';
import { createClient } from '@/lib/supabase/server';

export default async function ApplicationPage() {
  const { driver } = await requireDriver();
  const documents = await getDriverDocuments(driver.id);
  const vehicles = await getDriverVehicles(driver.id);
  const editable = canEditApplication(driver.status);

  const supabase = await createClient();
  const { data: latestApp } = await supabase
    .from('driver_applications')
    .select('reviewer_notes, status, reviewed_at')
    .eq('driver_id', driver.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ready =
    Boolean(driver.rut) && documents.length > 0 && vehicles.length > 0;

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Estado de la solicitud</h2>
      <Alert variant={driver.status === 'approved' ? 'success' : 'info'}>
        Estado actual: <strong>{STATUS_LABELS[driver.status] ?? driver.status}</strong>
      </Alert>

      {latestApp?.reviewer_notes ? (
        <Alert variant="info">Observaciones del revisor: {latestApp.reviewer_notes}</Alert>
      ) : null}

      <ul className="space-y-2 text-sm text-slate-700">
        <li>{driver.rut ? '✓' : '○'} Datos personales</li>
        <li>{documents.length > 0 ? '✓' : '○'} Documentos ({documents.length})</li>
        <li>{vehicles.length > 0 ? '✓' : '○'} Vehículo</li>
      </ul>

      {editable ? (
        ready ? (
          <SubmitApplicationButton />
        ) : (
          <Alert variant="error">
            Completa datos personales, al menos un documento y un vehículo antes de enviar.
          </Alert>
        )
      ) : (
        <Alert variant="info">
          {driver.status === 'submitted' || driver.status === 'under_review'
            ? 'Tu solicitud está en proceso de revisión.'
            : driver.status === 'approved'
              ? 'Tu cuenta fue aprobada. Ya puedes usar el panel operativo (fases siguientes).'
              : 'Tu solicitud no admite envío en este momento.'}
        </Alert>
      )}
    </div>
  );
}
