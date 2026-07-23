import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return 'payment_id,driver_id,amount,status,notes,created_at';
  }
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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('export_admin_payments_report', { p_days: 90 });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
  }

  const rows = ((data ?? []) as Array<Record<string, unknown>>).map((p) => ({
    payment_id: p.payment_id,
    driver_id: p.driver_id,
    amount: p.amount,
    status: p.status,
    notes: p.notes,
    created_at: p.created_at,
  }));

  return new NextResponse(toCsv(rows), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rapidex-pagos-90d.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
