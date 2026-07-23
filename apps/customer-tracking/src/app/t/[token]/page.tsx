import { AppShell, Surface } from '@pedidosgo/ui';
import { TrackingView } from '@/components/tracking-view';
import { normalizeTrackingToken } from '@/lib/tracking';
import Link from 'next/link';

export default async function TrackingTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const token = normalizeTrackingToken(raw);

  return (
    <AppShell
      variant="public"
      title="Tu pedido"
      subtitle="Actualización en vivo del estado de entrega."
    >
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm font-semibold text-teal-800 underline-offset-2 hover:underline"
        >
          ← Ingresar otro código
        </Link>
      </div>
      <Surface className="mx-auto max-w-2xl">
        {token.length < 16 ? (
          <p className="text-sm text-red-600">Código de seguimiento inválido.</p>
        ) : (
          <TrackingView token={token} />
        )}
      </Surface>
    </AppShell>
  );
}
