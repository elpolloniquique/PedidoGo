import { requireAppUser } from '@/lib/auth';
import { LogoutButton } from '@/components/auth/logout-button';
import { AppNotificationBell } from '@/components/notifications/app-notification-bell';
import { brandConfig } from '@pedidosgo/config';
import { AppShell, Button } from '@pedidosgo/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireAppUser();

  return (
    <AppShell
      title="Panel Superadministrador"
      subtitle={`${brandConfig.appName} · ${profile.email ?? profile.id}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="md">
            Inicio
          </Button>
        </Link>
        <Link href="/drivers">
          <Button variant="ghost" size="md">
            Repartidores
          </Button>
        </Link>
        <Link href="/finance">
          <Button variant="ghost" size="md">
            Finanzas
          </Button>
        </Link>
        <Link href="/system">
          <Button variant="ghost" size="md">
            Sistema
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="ghost" size="md">
            Perfil
          </Button>
        </Link>
        <AppNotificationBell />
        <LogoutButton />
      </div>
      {children}
    </AppShell>
  );
}
