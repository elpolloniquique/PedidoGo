import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const keys = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => escape(r[k])).join(','))].join(
    '\n',
  );
}

function csvResponse(filename: string, body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('export_admin_orders_report', { p_days: 30 });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
  }

  const rows = ((data ?? []) as Array<Record<string, unknown>>).map((o) => ({
    order_id: o.order_id,
    order_number: o.order_number,
    merchant_name: o.merchant_name,
    status: o.status,
    total: o.total,
    created_at: o.created_at,
    updated_at: o.updated_at,
  }));

  return csvResponse('rapidex-pedidos-30d.csv', toCsv(rows));
}
