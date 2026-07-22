'use server';

import { deliveryOfferSchema } from '@pedidosgo/validation';
import { revalidatePath } from 'next/cache';
import { requireDriver } from '@/lib/driver';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; message: string };

export async function submitOfferAction(formData: FormData): Promise<ActionResult> {
  const { driver } = await requireDriver();
  if (driver.status !== 'approved') {
    return { ok: false, message: 'Debes estar aprobado para ofertar.' };
  }

  const parsed = deliveryOfferSchema.safeParse({
    deliveryRequestId: formData.get('deliveryRequestId'),
    offeredPrice: formData.get('offeredPrice'),
    estimatedMinutes: formData.get('estimatedMinutes') || undefined,
    message: formData.get('message') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('submit_delivery_offer', {
    p_delivery_request_id: parsed.data.deliveryRequestId,
    p_offered_price: parsed.data.offeredPrice,
    p_estimated_minutes: parsed.data.estimatedMinutes ?? null,
    p_message: parsed.data.message || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/jobs');
  revalidatePath('/delivery');
  revalidatePath('/');
  return { ok: true, message: 'Oferta enviada.', id: data as string };
}

export async function advanceDeliveryAction(
  deliveryRequestId: string,
  newStatus: string,
  options?: { forceGeofence?: boolean },
): Promise<ActionResult> {
  await requireDriver();
  const supabase = await createClient();

  const needsPickup = newStatus === 'driver_arrived_store';
  const needsDelivery =
    newStatus === 'driver_arrived_customer' || newStatus === 'delivered';

  if ((needsPickup || needsDelivery) && !options?.forceGeofence) {
    const { data, error: geoError } = await supabase.rpc('check_geofence_for_delivery', {
      p_delivery_request_id: deliveryRequestId,
      p_geofence_type: needsPickup ? 'pickup' : 'delivery',
      p_radius_meters: 200,
      p_record_event: true,
    });
    if (geoError) {
      return { ok: false, message: geoError.message };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.inside === false) {
      const dist =
        row.distance_meters != null
          ? ` Estás a ~${Math.round(Number(row.distance_meters))} m.`
          : '';
      return {
        ok: false,
        message: `Fuera de la geocerca (200 m).${dist} Acércate o confirma de todos modos.`,
      };
    }
  }

  const { error } = await supabase.rpc('advance_delivery_status', {
    p_delivery_request_id: deliveryRequestId,
    p_new_status: newStatus,
    p_comment: options?.forceGeofence ? 'Confirmado fuera de geocerca' : null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/delivery');
  revalidatePath('/jobs');
  revalidatePath('/');
  return { ok: true, message: 'Estado actualizado.' };
}
