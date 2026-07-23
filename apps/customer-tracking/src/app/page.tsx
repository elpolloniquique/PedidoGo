import { brandConfig } from '@pedidosgo/config';
import { AppShell, Surface } from '@pedidosgo/ui';
import { TrackingCodeForm } from '@/components/tracking-code-form';

export default function TrackingHomePage() {
  return (
    <AppShell
      variant="public"
      title="Seguimiento del pedido"
      subtitle={`Consultá el estado de tu entrega en ${brandConfig.appName} con un enlace seguro y temporal.`}
    >
      <Surface className="mx-auto max-w-xl">
        <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Si el comercio te envió un enlace, abrilo directamente. También podés pegar el código
          aquí.
        </p>
        <div className="mt-6">
          <TrackingCodeForm />
        </div>
      </Surface>
    </AppShell>
  );
}
