import { requireAppUser } from '@/lib/auth';
import { LogoutButton } from '@/components/auth/logout-button';
import { AppNotificationBell } from '@/components/notifications/app-notification-bell';
import { brandConfig } from '@pedidosgo/config';
import { AppShell, PanelNav } from '@pedidosgo/ui';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/jobs', label: 'Pedidos' },
  { href: '/delivery', label: 'Entrega' },
  { href: '/wallet', label: 'Billetera' },
  { href: '/onboarding', label: 'Datos' },
  { href: '/documents', label: 'Documentos' },
  { href: '/vehicle', label: 'Vehículo' },
  { href: '/application', label: 'Solicitud' },
  { href: '/support', label: 'Soporte' },
  { href: '/profile', label: 'Perfil' },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireAppUser();

  return (
    <AppShell
      variant="panel"
      title="App del Repartidor"
      subtitle={`${brandConfig.appName} · ${profile.email ?? profile.id}`}
      toolbar={
        <PanelNav
          items={NAV}
          trailing={
            <>
              <AppNotificationBell />
              <LogoutButton />
            </>
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}
