import { requireAppUser } from '@/lib/auth';
import { listBranches, requireMerchantContext } from '@/lib/merchant';
import { createClient } from '@/lib/supabase/server';
import { Alert, HomeActionGrid, Surface } from '@pedidosgo/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function MerchantHomePage() {
  await requireAppUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from('merchant_users')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect('/onboarding');
  }

  const { merchant, membershipRole } = await requireMerchantContext();
  const branches = await listBranches(merchant.id);
  const primary = branches[0];

  const actions = [
    {
      href: '/orders/new',
      title: 'Nuevo pedido',
      description: 'Creá un pedido manual y publicalo a repartidores.',
    },
    {
      href: '/orders',
      title: 'Pedidos',
      description: 'Seguí estados, ofertas y el mapa de cada entrega.',
    },
    {
      href: '/branches',
      title: `Sucursales (${branches.length})`,
      description: 'Ubicación, horarios y modo de despacho.',
    },
    {
      href: '/merchant',
      title: 'Datos del comercio',
      description: 'Nombre, contacto y configuración general.',
    },
    {
      href: '/users',
      title: 'Usuarios',
      description: 'Operadores y roles del equipo.',
    },
    ...(primary
      ? [
          {
            href: `/branches/${primary.id}/settings`,
            title: 'Modo despacho',
            description: 'Ofertas, tarifa fija y radio de búsqueda.',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <Surface>
        <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">
          Comercio
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          {merchant.name}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Rol: <strong>{membershipRole}</strong>
          {merchant.isApproved ? ' · aprobado' : ' · pendiente de aprobación'}
        </p>
        <div className="mt-5">
          <Alert variant="info">
            Creá pedidos, aceptá ofertas y compartí el enlace de seguimiento con tus clientes.
          </Alert>
        </div>
      </Surface>

      <HomeActionGrid actions={actions} />

      {branches.length > 0 ? (
        <Surface>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
            Sucursales
          </h3>
          <ul className="mt-4 divide-y divide-slate-100">
            {branches.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="text-[var(--color-ink)]">
                  {b.name}
                  {!b.isActive ? (
                    <span className="ml-2 text-[var(--color-ink-muted)]">(inactiva)</span>
                  ) : null}
                </span>
                <Link
                  href={`/branches/${b.id}`}
                  className="font-semibold text-teal-800 underline-offset-2 hover:underline"
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
    </div>
  );
}
