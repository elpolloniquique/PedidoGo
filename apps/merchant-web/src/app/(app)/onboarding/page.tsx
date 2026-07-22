import { requireAppUser } from '@/lib/auth';
import { OnboardingPanel } from '@/components/merchant/onboarding-panel';
import { createClient } from '@/lib/supabase/server';
import { Alert } from '@pedidosgo/ui';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  await requireAppUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from('merchant_users')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (membership) {
    redirect('/');
  }

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Configura tu comercio</h2>
      <Alert variant="info">
        Tu cuenta aún no está vinculada a un comercio. Crea uno nuevo o vincula el demo El Pollón
        (si el seed está cargado).
      </Alert>
      <OnboardingPanel />
    </div>
  );
}
