import { requireAppUser } from '@/lib/auth';
import { Alert, Button } from '@pedidosgo/ui';
import Link from 'next/link';

export default async function AdminHomePage() {
  const profile = await requireAppUser();

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        Hola{profile.firstName ? `, ${profile.firstName}` : ''}
      </h2>
      <p className="text-sm text-slate-600">
        Roles: <strong>{profile.roles.join(', ') || 'sin roles'}</strong>
      </p>
      <Alert variant="info">
        Puedes aprobar repartidores y gestionar comisiones / pagos de deuda.
      </Alert>
      <div className="flex flex-wrap gap-3">
        <Link href="/drivers">
          <Button size="lg">Repartidores</Button>
        </Link>
        <Link href="/finance">
          <Button size="lg" variant="secondary">
            Finanzas
          </Button>
        </Link>
        <Link href="/system">
          <Button size="lg" variant="secondary">
            Sistema
          </Button>
        </Link>
      </div>
    </div>
  );
}
