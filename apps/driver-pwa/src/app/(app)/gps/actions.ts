'use server';

import { revalidatePath } from 'next/cache';
import { requireDriver } from '@/lib/driver';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export type AvailabilitySnapshot = {
  status: 'available' | 'busy' | 'offline';
  changedAt: string | null;
  hasLocation: boolean;
  lat: number | null;
  lng: number | null;
  locationRecordedAt: string | null;
};

export async function getAvailabilityAction(): Promise<AvailabilitySnapshot | null> {
  await requireDriver();
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_my_availability');
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    status: row.status,
    changedAt: row.changed_at ?? null,
    hasLocation: Boolean(row.has_location),
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    locationRecordedAt: row.location_recorded_at ?? null,
  };
}

export async function setAvailabilityAction(
  status: 'available' | 'offline',
): Promise<ActionResult> {
  const { driver } = await requireDriver();
  if (driver.status !== 'approved') {
    return { ok: false, message: 'Debes estar aprobado.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('set_my_availability', { p_status: status });
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/');
  revalidatePath('/jobs');
  return { ok: true, message: status === 'available' ? 'Estás en línea' : 'Estás offline' };
}

export async function checkGeofenceAction(
  deliveryRequestId: string,
  geofenceType: 'pickup' | 'delivery',
  radiusMeters = 200,
): Promise<{ ok: true; inside: boolean; distanceMeters: number | null } | { ok: false; message: string }> {
  await requireDriver();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('check_geofence_for_delivery', {
    p_delivery_request_id: deliveryRequestId,
    p_geofence_type: geofenceType,
    p_radius_meters: radiusMeters,
    p_record_event: true,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    inside: Boolean(row?.inside),
    distanceMeters: row?.distance_meters != null ? Number(row.distance_meters) : null,
  };
}
