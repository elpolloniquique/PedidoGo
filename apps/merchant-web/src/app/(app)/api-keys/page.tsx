import { Alert, Surface } from '@pedidosgo/ui';
import { requireMerchantContext } from '@/lib/merchant';
import { createClient } from '@/lib/supabase/server';
import { ApiKeysPanel } from './api-keys-panel';

export default async function ApiKeysPage() {
  const { membershipRole } = await requireMerchantContext();
  const canManage = membershipRole === 'owner' || membershipRole === 'admin';
  const supabase = await createClient();
  const { data } = await supabase.rpc('list_merchant_api_keys');

  const keys = ((data ?? []) as Array<Record<string, unknown>>).map((k) => ({
    id: String(k.id),
    name: String(k.name),
    prefix: String(k.key_prefix),
    isActive: Boolean(k.is_active),
    lastUsedAt: (k.last_used_at as string | null) ?? null,
    createdAt: String(k.created_at ?? ''),
  }));

  return (
    <div className="space-y-5">
      <Surface>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          API keys
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Autenticá integraciones con{' '}
          <code>Authorization: Bearer rx_…</code> contra{' '}
          <code>/api/v1/orders</code>.
        </p>
      </Surface>

      {!canManage ? (
        <Alert variant="info">Solo el dueño o administrador puede gestionar API keys.</Alert>
      ) : (
        <ApiKeysPanel keys={keys} />
      )}
    </div>
  );
}
