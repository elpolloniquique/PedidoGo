import { requireAppUser } from '@/lib/auth';
import { LogoutButton } from '@/components/auth/logout-button';
import { AppNotificationBell } from '@/components/notifications/app-notification-bell';
import { brandConfig } from '@pedidosgo/config';
import { AppShell, Button } from '@pedidosgo/ui';
import Link from 'next/link';
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
      title="Panel del Comercio"
      subtitle={`${brandConfig.appName} · ${profile.email ?? profile.id}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" size="md">
              {item.label}
            </Button>
          </Link>
        ))}
        <AppNotificationBell />
        <LogoutButton />
      </div>
      {children}
    </AppShell>
  );
}
