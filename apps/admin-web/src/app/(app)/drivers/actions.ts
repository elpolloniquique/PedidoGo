'use server';

import { reviewDriverActionSchema } from '@pedidosgo/validation';
import { revalidatePath } from 'next/cache';
import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export async function reviewDriverAction(
  driverId: string,
  action: string,
  notes?: string,
): Promise<ActionResult> {
  await requireAppUser();

  const parsedAction = reviewDriverActionSchema.safeParse(action);
  if (!parsedAction.success) {
    return { ok: false, message: 'Acción no válida' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('review_driver_application', {
    p_driver_id: driverId,
    p_action: parsedAction.data,
    p_notes: notes || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/drivers');
  revalidatePath(`/drivers/${driverId}`);
  return { ok: true, message: 'Solicitud actualizada.' };
}
