import { AppShell } from '@pedidosgo/ui';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      variant="auth"
      title="Panel del comercio"
      subtitle="Gestioná pedidos, sucursales y repartidores desde un solo lugar."
    >
      {children}
    </AppShell>
  );
}
