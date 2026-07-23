import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization');
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const query = new URL(request.url).searchParams.get('secret');
  return bearer === secret || query === secret;
}

async function dispatch() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('claim_pending_webhook_deliveries', {
    p_limit: 40,
  });

  if (error) {
    return { ok: false as const, error: error.message, delivered: 0, failed: 0 };
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

  return { ok: true as const, delivered, failed, claimed: rows.length };
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const result = await dispatch();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(request: Request) {
  return GET(request);
}
