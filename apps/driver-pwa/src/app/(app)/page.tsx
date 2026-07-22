import { Alert, Button } from '@pedidosgo/ui';
import Link from 'next/link';
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

  return (
    <div className="space-y-4">
      <OfflineProfileSync
        driverId={driver.id}
        status={driver.status}
        email={profile.email}
        firstName={profile.firstName}
      />
      <OfflineStatusBanner />
      <InstallPrompt driverApproved={approved} driverId={driver.id} />

      <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Hola{profile.firstName ? `, ${profile.firstName}` : ''}
        </h2>
        <Alert variant={approved ? 'success' : 'info'}>
          Estado de solicitud:{' '}
          <strong>{STATUS_LABELS[driver.status] ?? driver.status}</strong>
        </Alert>

        {approved ? <AvailabilityPanel /> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {approved ? (
            <>
              <Link href="/jobs">
                <Button className="w-full" size="lg">
                  Pedidos disponibles
                </Button>
              </Link>
              <Link href="/delivery">
                <Button className="w-full" size="lg" variant="secondary">
                  Mi entrega activa
                </Button>
              </Link>
              <Link href="/wallet">
                <Button className="w-full" size="lg" variant="secondary">
                  Billetera
                </Button>
              </Link>
            </>
          ) : null}
          <Link href="/onboarding">
            <Button className="w-full" size="lg" variant="secondary">
              1. Datos personales {driver.rut ? '✓' : ''}
            </Button>
          </Link>
          <Link href="/documents">
            <Button className="w-full" size="lg" variant="secondary">
              2. Documentos ({documents.length})
            </Button>
          </Link>
          <Link href="/vehicle">
            <Button className="w-full" size="lg" variant="secondary">
              3. Vehículo ({vehicles.length})
            </Button>
          </Link>
          <Link href="/application">
            <Button className="w-full" size="lg" variant="secondary">
              4. Enviar / ver estado
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
