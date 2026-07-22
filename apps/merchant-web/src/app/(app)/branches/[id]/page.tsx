import { BranchForm } from '@/components/merchant/branch-form';
import { getBranch, requireMerchantContext } from '@/lib/merchant';
import { Button } from '@pedidosgo/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { merchant } = await requireMerchantContext();
  const { id } = await params;
  const branch = await getBranch(id);

  if (!branch || branch.merchantId !== merchant.id) {
    notFound();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">{branch.name}</h2>
        <div className="flex gap-2">
          <Link href={`/branches/${branch.id}/hours`}>
            <Button variant="ghost" size="md">
              Horarios
            </Button>
          </Link>
          <Link href={`/branches/${branch.id}/settings`}>
            <Button variant="ghost" size="md">
              Configuración
            </Button>
          </Link>
        </div>
      </div>
      <BranchForm mode="edit" branch={branch} />
    </div>
  );
}
