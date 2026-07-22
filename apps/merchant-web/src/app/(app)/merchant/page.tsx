import { MerchantForm } from '@/components/merchant/merchant-form';
import { requireMerchantContext } from '@/lib/merchant';

export default async function MerchantPage() {
  const { merchant } = await requireMerchantContext();

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Datos del comercio</h2>
      <MerchantForm merchant={merchant} />
    </div>
  );
}
