import { Alert } from '@pedidosgo/ui';
import { PersonalForm } from '@/components/driver/personal-form';
import { canEditApplication, requireDriver } from '@/lib/driver';

export default async function OnboardingPage() {
  const { driver } = await requireDriver();
  const editable = canEditApplication(driver.status);

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Datos personales</h2>
      <p className="text-sm text-slate-600">
        Completa tu información para continuar con la solicitud de repartidor.
      </p>
      {!editable ? (
        <Alert variant="info">Tu solicitud está en revisión o ya fue procesada. No puedes editar estos datos ahora.</Alert>
      ) : (
        <PersonalForm driver={driver} />
      )}
    </div>
  );
}
