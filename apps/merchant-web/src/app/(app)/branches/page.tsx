import { listBranches, requireMerchantContext } from '@/lib/merchant';
import { Button } from '@pedidosgo/ui';
import Link from 'next/link';

export default async function BranchesPage() {
  const { merchant } = await requireMerchantContext();
  const branches = await listBranches(merchant.id);

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Sucursales</h2>
        <Link href="/branches/new">
          <Button size="md">Nueva sucursal</Button>
        </Link>
      </div>

      {branches.length === 0 ? (
        <p className="text-sm text-slate-600">Aún no hay sucursales.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {branches.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-slate-900">{b.name}</p>
                <p className="text-sm text-slate-600">
                  {b.addressLine}, {b.commune}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/branches/${b.id}`}>
                  <Button variant="ghost" size="md">
                    Editar
                  </Button>
                </Link>
                <Link href={`/branches/${b.id}/hours`}>
                  <Button variant="ghost" size="md">
                    Horarios
                  </Button>
                </Link>
                <Link href={`/branches/${b.id}/settings`}>
                  <Button variant="ghost" size="md">
                    Config
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
