import { BranchHoursForm } from '@/components/merchant/branch-hours-form';
import { getBranch, getBranchHours, requireMerchantContext } from '@/lib/merchant';
import { notFound } from 'next/navigation';

export default async function BranchHoursPage({
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

  const hours = await getBranchHours(id);

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Horarios · {branch.name}</h2>
      <BranchHoursForm branchId={id} hours={hours} />
    </div>
  );
}
