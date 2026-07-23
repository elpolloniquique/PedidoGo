import { AppShell, Surface } from '@pedidosgo/ui';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      variant="auth"
      title="Panel Superadministrador"
      subtitle="Gestioná repartidores, finanzas y la salud de la plataforma."
    >
      <Surface className="text-left">{children}</Surface>
    </AppShell>
  );
}
