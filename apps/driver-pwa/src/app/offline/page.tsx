import { brandConfig } from '@pedidosgo/config';
import { AppShell, Button } from '@pedidosgo/ui';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <AppShell
      title="Sin conexión"
      subtitle={`${brandConfig.appShortName} — modo offline limitado`}
    >
      <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          No hay Internet en este momento. Puedes revisar información básica en caché.
          Las acciones sensibles se sincronizarán al reconectar.
        </p>
        <Link href="/">
          <Button size="lg">Reintentar</Button>
        </Link>
      </div>
    </AppShell>
  );
}
