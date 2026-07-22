import { brandConfig } from '@pedidosgo/config';
import { AppShell } from '@pedidosgo/ui';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      title={`Acceso — ${brandConfig.appShortName}`}
      subtitle="Inicia sesión de forma segura con Supabase Auth."
    >
      <div className="rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm backdrop-blur">
        {children}
      </div>
    </AppShell>
  );
}
