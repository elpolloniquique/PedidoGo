import { brandConfig } from '@pedidosgo/config';
import { AppShell } from '@pedidosgo/ui';
import { TrackingCodeForm } from '@/components/tracking-code-form';

export default function TrackingHomePage() {
  return (
    <AppShell
      variant="public"
      title="Seguimiento del pedido"
      subtitle={`Consultá el estado de tu entrega en ${brandConfig.appName} con un enlace seguro y temporal.`}
    >
      <TrackingCodeForm />
    </AppShell>
  );
}
