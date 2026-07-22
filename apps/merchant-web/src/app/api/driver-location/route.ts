import { getAuthProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { canAccessApp } from '@pedidosgo/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
  }

  const profile = await getAuthProfile();
  if (!profile || !profile.isActive || !canAccessApp('merchant-web', profile.roles)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_order_driver_location', {
    p_order_id: orderId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    driverId: row.driver_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    accuracyMeters: row.accuracy_meters != null ? Number(row.accuracy_meters) : null,
    recordedAt: row.recorded_at,
    heading: row.heading_degrees != null ? Number(row.heading_degrees) : null,
    speed: row.speed_mps != null ? Number(row.speed_mps) : null,
  });
}
