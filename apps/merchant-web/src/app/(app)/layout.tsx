import { requireAppUser } from '@/lib/auth';
import { LogoutButton } from '@/components/auth/logout-button';
import { AppNotificationBell } from '@/components/notifications/app-notification-bell';
import { brandConfig } from '@pedidosgo/config';
import { AppShell, PanelNav } from '@pedidosgo/ui';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/orders', label: 'Pedidos' },
  { href: '/merchant', label: 'Comercio' },
  { href: '/branches', label: 'Sucursales' },
  { href: '/users', label: 'Usuarios' },
  { href: '/profile', label: 'Perfil' },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireAppUser();

  return (
    <AppShell
      variant="panel"
      title="Panel del Comercio"
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
