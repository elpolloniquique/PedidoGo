import { BranchSettingsForm } from '@/components/merchant/branch-settings-form';
import {
  getBranch,
  getBranchSettings,
  requireMerchantContext,
} from '@/lib/merchant';
import { Alert } from '@pedidosgo/ui';
import { notFound } from 'next/navigation';

export default async function BranchSettingsPage({
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

  const settings = await getBranchSettings(id);
  if (!settings) {
    notFound();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Configuración · {branch.name}</h2>
      <Alert variant="info">
        En modo <strong>manual</strong> eliges al repartidor. En <strong>automático</strong> la
        plataforma asigna según la estrategia (se usará en la Fase 7 de pedidos).
      </Alert>
      <BranchSettingsForm settings={settings} />
    </div>
  );
}
