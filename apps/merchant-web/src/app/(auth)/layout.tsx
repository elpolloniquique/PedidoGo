import { AppShell, Surface } from '@pedidosgo/ui';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      variant="auth"
      title="Panel del comercio"
      subtitle="Gestioná pedidos, sucursales y repartidores desde un solo lugar."
    >
      <Surface className="text-left">{children}</Surface>
    </AppShell>
  );
}
