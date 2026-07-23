import { Alert, HomeActionGrid, Surface } from '@pedidosgo/ui';
import {
  getDriverDocuments,
  getDriverVehicles,
  requireDriver,
  STATUS_LABELS,
} from '@/lib/driver';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { OfflineStatusBanner } from '@/components/pwa/offline-status-banner';
import { OfflineProfileSync } from '@/components/pwa/offline-profile-sync';
import { AvailabilityPanel } from '@/components/gps/availability-panel';

export default async function DriverHomePage() {
  const { profile, driver } = await requireDriver();
  const documents = await getDriverDocuments(driver.id);
  const vehicles = await getDriverVehicles(driver.id);
  const approved = driver.status === 'approved';

  const onboardingActions = [
    {
      href: '/onboarding',
      title: `Datos personales${driver.rut ? ' ✓' : ''}`,
      description: 'RUT, dirección y contacto de emergencia.',
    },
    {
      href: '/documents',
      title: `Documentos (${documents.length})`,
      description: 'Cédula, licencia y antecedentes.',
    },
    {
      href: '/vehicle',
      title: `Vehículo (${vehicles.length})`,
      description: 'Tipo, patente y seguro.',
    },
    {
      href: '/application',
      title: 'Enviar / ver estado',
      description: 'Mandá tu solicitud o revisá la revisión.',
    },
  ];

  const workActions = approved
    ? [
        {
          href: '/jobs',
          title: 'Pedidos disponibles',
          description: 'Ofertá tarifas en trabajos abiertos cerca tuyo.',
        },
        {
          href: '/delivery',
          title: 'Entrega activa',
          description: 'Avanzá estados, GPS y evidencia fotográfica.',
        },
        {
          href: '/wallet',
          title: 'Billetera',
          description: 'Ingresos, comisión y pagos de deuda.',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <OfflineProfileSync
        driverId={driver.id}
        status={driver.status}
        email={profile.email}
        firstName={profile.firstName}
      />
      <OfflineStatusBanner />
      <InstallPrompt driverApproved={approved} driverId={driver.id} />

      <Surface>
        <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">
          Repartidor
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Hola{profile.firstName ? `, ${profile.firstName}` : ''}
        </h2>
        <div className="mt-4">
          <Alert variant={approved ? 'success' : 'info'}>
            Estado de solicitud:{' '}
            <strong>{STATUS_LABELS[driver.status] ?? driver.status}</strong>
          </Alert>
        </div>
        {approved ? (
          <div className="mt-5">
            <AvailabilityPanel />
          </div>
        ) : null}
      </Surface>

      {workActions.length > 0 ? <HomeActionGrid actions={workActions} /> : null}
      <div className="space-y-3">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
          Onboarding
        </h3>
        <HomeActionGrid actions={onboardingActions} />
      </div>
    </div>
  );
}
