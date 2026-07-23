import { Alert, Surface } from '@pedidosgo/ui';
import { requireMerchantContext } from '@/lib/merchant';
import { createClient } from '@/lib/supabase/server';
import { WebhooksPanel } from './webhooks-panel';

export default async function WebhooksPage() {
  const { membershipRole } = await requireMerchantContext();
  const canManage = membershipRole === 'owner' || membershipRole === 'admin';
  const supabase = await createClient();

  const [{ data: hooks }, { data: events }] = await Promise.all([
    supabase.rpc('list_merchant_webhooks'),
    supabase.rpc('list_merchant_webhook_events', { p_limit: 40 }),
  ]);

  const webhooks = ((hooks ?? []) as Array<Record<string, unknown>>).map((w) => ({
    id: String(w.id),
    url: String(w.url),
    events: (w.events as string[]) ?? [],
    isActive: Boolean(w.is_active),
    secretHint: String(w.secret_hint ?? '—'),
    createdAt: String(w.created_at ?? ''),
  }));

  const eventRows = ((events ?? []) as Array<Record<string, unknown>>).map((e) => ({
    id: String(e.id),
    eventType: String(e.event_type),
    status: String(e.status),
    attempts: Number(e.attempts ?? 0),
    lastError: (e.last_error as string | null) ?? null,
    createdAt: String(e.created_at ?? ''),
  }));

  return (
    <div className="space-y-5">
      <Surface>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          Webhooks
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Recibí eventos de pedidos en tu servidor (HTTPS). Firmamos el body con{' '}
          <code>X-RapideX-Signature: sha256=…</code>.
        </p>
      </Surface>

      {!canManage ? (
        <Alert variant="info">Solo el dueño o administrador del comercio puede gestionar webhooks.</Alert>
      ) : (
        <WebhooksPanel webhooks={webhooks} events={eventRows} />
      )}
    </div>
  );
}
