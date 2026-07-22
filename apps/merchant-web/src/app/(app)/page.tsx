import { requireAppUser } from '@/lib/auth';
import { listBranches, requireMerchantContext } from '@/lib/merchant';
import { createClient } from '@/lib/supabase/server';
import { Alert, Button } from '@pedidosgo/ui';
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

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{merchant.name}</h2>
        <p className="text-sm text-slate-600">
          Tu rol en el comercio: <strong>{membershipRole}</strong>
          {merchant.isApproved ? ' · aprobado' : ' · pendiente de aprobación'}
        </p>
        <Alert variant="info">
          Crea pedidos manuales, publícalos a repartidores y acepta ofertas. Mapas y GPS llegan en
          fases 8–9.
        </Alert>
      </div>

        <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/orders">
          <Button variant="secondary" size="lg" className="w-full">
            Pedidos
          </Button>
        </Link>
        <Link href="/orders/new">
          <Button size="lg" className="w-full">
            Nuevo pedido
          </Button>
        </Link>
        <Link href="/merchant">
          <Button variant="secondary" size="lg" className="w-full">
            Datos del comercio
          </Button>
        </Link>
        <Link href="/branches">
          <Button variant="secondary" size="lg" className="w-full">
            Sucursales ({branches.length})
          </Button>
        </Link>
        {primary ? (
          <>
            <Link href={`/branches/${primary.id}/settings`}>
              <Button variant="secondary" size="lg" className="w-full">
                Modo despacho
              </Button>
            </Link>
            <Link href={`/branches/${primary.id}/hours`}>
              <Button variant="secondary" size="lg" className="w-full">
                Horarios
              </Button>
            </Link>
          </>
        ) : null}
        <Link href="/users">
          <Button variant="secondary" size="lg" className="w-full">
            Usuarios
          </Button>
        </Link>
      </div>

      {branches.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Sucursales</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {branches.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {b.name}
                  {!b.isActive ? ' (inactiva)' : ''}
                </span>
                <Link href={`/branches/${b.id}`} className="text-teal-700 underline">
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
