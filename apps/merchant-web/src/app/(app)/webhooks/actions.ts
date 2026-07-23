'use server';

import { createHmac } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireMerchantContext } from '@/lib/merchant';
import { createClient } from '@/lib/supabase/server';

export type ActionResult =
  | { ok: true; message?: string; secret?: string; id?: string }
  | { ok: false; message: string };

export async function createWebhookAction(formData: FormData): Promise<ActionResult> {
  await requireMerchantContext();
  const url = String(formData.get('url') || '').trim();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_merchant_webhook', {
    p_url: url,
    p_events: ['order.status_changed', 'webhook.test'],
  });

  if (error) return { ok: false, message: error.message };

  const row = data as { id?: string; secret?: string } | null;
  revalidatePath('/webhooks');
  return {
    ok: true,
    message: 'Webhook creado. Copiá el secreto ahora; no se volverá a mostrar completo.',
    id: row?.id,
    secret: row?.secret,
  };
}

export async function setWebhookActiveAction(
  webhookId: string,
  active: boolean,
): Promise<ActionResult> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_merchant_webhook_active', {
    p_webhook_id: webhookId,
    p_active: active,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/webhooks');
  return { ok: true, message: active ? 'Webhook activado.' : 'Webhook pausado.' };
}

export async function deleteWebhookAction(webhookId: string): Promise<ActionResult> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_merchant_webhook', {
    p_webhook_id: webhookId,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/webhooks');
  return { ok: true, message: 'Webhook eliminado.' };
}

export async function testWebhookAction(webhookId: string): Promise<ActionResult> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc('test_merchant_webhook', {
    p_webhook_id: webhookId,
  });
  if (error) return { ok: false, message: error.message };

  const dispatched = await dispatchPendingWebhooks();
  revalidatePath('/webhooks');
  return {
    ok: true,
    message: dispatched.ok
      ? `Prueba encolada y despachada (${dispatched.delivered} ok / ${dispatched.failed} fallos).`
      : 'Prueba encolada. El despacho falló: ' + dispatched.message,
  };
}

export async function dispatchWebhooksAction(): Promise<ActionResult> {
  await requireMerchantContext();
  const result = await dispatchPendingWebhooks();
  revalidatePath('/webhooks');
  if (!result.ok) return { ok: false, message: result.message };
  return {
    ok: true,
    message: `Despachados: ${result.delivered} ok, ${result.failed} fallos.`,
  };
}

async function dispatchPendingWebhooks(): Promise<{
  ok: boolean;
  message: string;
  delivered: number;
  failed: number;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('claim_pending_webhook_deliveries', {
    p_limit: 20,
  });

  if (error) {
    return { ok: false, message: error.message, delivered: 0, failed: 0 };
  }

  const rows = (data ?? []) as Array<{
    event_id: string;
    event_type: string;
    payload: unknown;
    url: string;
    secret: string | null;
  }>;

  let delivered = 0;
  let failed = 0;

  for (const row of rows) {
    const body = JSON.stringify({
      id: row.event_id,
      type: row.event_type,
      data: row.payload,
      sent_at: new Date().toISOString(),
    });
    const signature = row.secret
      ? createHmac('sha256', row.secret).update(body).digest('hex')
      : '';

    try {
      const res = await fetch(row.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RapideX-Webhooks/1.0',
          ...(signature ? { 'X-RapideX-Signature': `sha256=${signature}` } : {}),
        },
        body,
        signal: AbortSignal.timeout(12_000),
      });

      if (res.ok) {
        await supabase.rpc('mark_webhook_event_result', {
          p_event_id: row.event_id,
          p_ok: true,
        });
        delivered += 1;
      } else {
        await supabase.rpc('mark_webhook_event_result', {
          p_event_id: row.event_id,
          p_ok: false,
          p_error: `HTTP ${res.status}`,
        });
        failed += 1;
      }
    } catch (e) {
      await supabase.rpc('mark_webhook_event_result', {
        p_event_id: row.event_id,
        p_ok: false,
        p_error: e instanceof Error ? e.message : 'fetch error',
      });
      failed += 1;
    }
  }

  return { ok: true, message: 'ok', delivered, failed };
}
