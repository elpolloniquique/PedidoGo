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
      title="App del Repartidor"
      subtitle={`${brandConfig.appName} · ${profile.email ?? profile.id}`}
    >
      <nav className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="md">
            Inicio
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="ghost" size="md">
            Pedidos
          </Button>
        </Link>
        <Link href="/delivery">
          <Button variant="ghost" size="md">
            Entrega
          </Button>
        </Link>
        <Link href="/wallet">
          <Button variant="ghost" size="md">
            Billetera
          </Button>
        </Link>
        <Link href="/onboarding">
          <Button variant="ghost" size="md">
            Datos
          </Button>
        </Link>
        <Link href="/documents">
          <Button variant="ghost" size="md">
            Documentos
          </Button>
        </Link>
        <Link href="/vehicle">
          <Button variant="ghost" size="md">
            Vehículo
          </Button>
        </Link>
        <Link href="/application">
          <Button variant="ghost" size="md">
            Solicitud
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="ghost" size="md">
            Perfil
          </Button>
        </Link>
        <AppNotificationBell />
        <LogoutButton />
      </nav>
      {children}
    </AppShell>
  );
}
