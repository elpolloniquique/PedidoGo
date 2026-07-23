import { AppShell } from '@pedidosgo/ui';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      variant="auth"
      title="App del repartidor"
      subtitle="Recibí pedidos, compartí tu ubicación y cobrá tus entregas."
    >
      {children}
    </AppShell>
  );
}
