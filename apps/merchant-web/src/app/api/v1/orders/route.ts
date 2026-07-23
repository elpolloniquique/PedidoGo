import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBearer(request: Request): string | null {
  const h = request.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) return null;
  return h.slice(7).trim();
}

export async function GET(request: Request) {
  const apiKey = getBearer(request);
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Missing Bearer token' }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: resolved, error: resolveError } = await supabase.rpc(
      'resolve_merchant_api_key',
      { p_api_key: apiKey },
    );

    if (resolveError) {
      return NextResponse.json({ ok: false, error: resolveError.message }, { status: 500 });
    }

    const row = Array.isArray(resolved) ? resolved[0] : resolved;
    if (!row?.merchant_id) {
      return NextResponse.json({ ok: false, error: 'Invalid API key' }, { status: 401 });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, updated_at')
      .eq('merchant_id', row.merchant_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      merchant_id: row.merchant_id,
      orders: orders ?? [],
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 },
    );
  }
}
