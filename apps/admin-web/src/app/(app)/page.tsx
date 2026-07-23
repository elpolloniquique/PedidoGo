import { requireAppUser } from '@/lib/auth';
import { Alert, HomeActionGrid, Surface } from '@pedidosgo/ui';

export default async function AdminHomePage() {
  const profile = await requireAppUser();

  return (
    <div className="space-y-6">
      <Surface>
        <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">
          Bienvenido
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Hola{profile.firstName ? `, ${profile.firstName}` : ''}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Rol activo:{' '}
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900">
            {profile.roles.join(', ') || 'sin roles'}
          </span>
        </p>
        <div className="mt-5">
          <Alert variant="info">
            Desde aquí aprobás repartidores, revisás comisiones y monitoreás la salud de la
            plataforma.
          </Alert>
        </div>
      </Surface>

      <HomeActionGrid
        actions={[
          {
            href: '/drivers',
            title: 'Repartidores',
            description: 'Revisá solicitudes, documentos y estados de aprobación.',
          },
          {
            href: '/finance',
            title: 'Finanzas',
            description: 'Regla de comisión, deudas y pagos pendientes.',
          },
          {
            href: '/system',
            title: 'Sistema',
            description: 'Métricas operativas y estado de producción.',
          },
        ]}
      />
    </div>
  );
}
