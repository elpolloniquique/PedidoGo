import { BranchForm } from '@/components/merchant/branch-form';
import { requireMerchantContext } from '@/lib/merchant';

export default async function NewBranchPage() {
  await requireMerchantContext();

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Nueva sucursal</h2>
      <BranchForm mode="create" />
    </div>
  );
}
