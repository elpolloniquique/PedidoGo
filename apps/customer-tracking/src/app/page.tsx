import { brandConfig } from '@pedidosgo/config';
import { AppShell } from '@pedidosgo/ui';
import { TrackingCodeForm } from '@/components/tracking-code-form';

export default function TrackingHomePage() {
  return (
    <AppShell
      title="Seguimiento del Pedido"
      subtitle={`Consulta el estado de tu entrega en ${brandConfig.appName} con un enlace seguro y temporal.`}
    >
      <div className="rounded-2xl border border-teal-900/10 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="mb-6 text-sm text-slate-600">
          Si el comercio te envió un enlace, ábrelo directamente. También puedes pegar el código
          aquí.
        </p>
        <TrackingCodeForm />
      </div>
    </AppShell>
  );
}
