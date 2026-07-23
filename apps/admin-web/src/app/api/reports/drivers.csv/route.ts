import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return 'driver_id,email,status,average_rating,completed_deliveries,availability,created_at';
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

  const { data, error } = await supabase.rpc('export_admin_drivers_report');
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
  }

  const rows = ((data ?? []) as Array<Record<string, unknown>>).map((d) => ({
    driver_id: d.driver_id,
    email: d.email,
    status: d.status,
    average_rating: d.average_rating,
    completed_deliveries: d.completed_deliveries,
    availability: d.availability,
    created_at: d.created_at,
  }));

  return new NextResponse(toCsv(rows), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rapidex-repartidores.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
