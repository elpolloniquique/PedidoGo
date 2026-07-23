import { requireAppUser } from '@/lib/auth';
import { Alert, HomeActionGrid, Surface } from '@pedidosgo/ui';

export default async function AdminHomePage() {
  const profile = await requireAppUser();

  return (
    <>
      <Surface>
        <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">
          Bienvenido
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-[2.1rem]">
          Hola{profile.firstName ? `, ${profile.firstName}` : ''}
        </h2>
        <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
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
            href: '/dashboard',
            title: 'Dashboard',
            description: 'Métricas en vivo: repartidores, pedidos y finanzas.',
            initial: 'D',
          },
          {
            href: '/drivers',
            title: 'Repartidores',
            description: 'Revisá solicitudes, documentos y estados de aprobación.',
            initial: 'R',
          },
          {
            href: '/finance',
            title: 'Finanzas',
            description: 'Regla de comisión, deudas y pagos pendientes.',
            initial: 'F',
          },
          {
            href: '/system',
            title: 'Sistema',
            description: 'Métricas operativas y estado de producción.',
            initial: 'S',
          },
          {
            href: '/ops',
            title: 'Operaciones',
            description: 'Flags, auditoría, settings y errores de sistema.',
            initial: 'O',
          },
          {
            href: '/support',
            title: 'Soporte',
            description: 'Tickets de ayuda de comercios y repartidores.',
            initial: 'T',
          },
        ]}
      />
    </>
  );
}
