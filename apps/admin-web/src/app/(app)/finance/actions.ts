'use server';

import { revalidatePath } from 'next/cache';
import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export async function reviewPaymentAction(
  paymentId: string,
  action: 'approve' | 'reject',
  notes?: string,
): Promise<ActionResult> {
  await requireAppUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc('review_commission_payment', {
    p_payment_id: paymentId,
    p_action: action,
    p_notes: notes || null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/finance');
  return { ok: true, message: action === 'approve' ? 'Pago aprobado.' : 'Pago rechazado.' };
}

export async function updateCommissionRateAction(formData: FormData): Promise<ActionResult> {
  await requireAppUser();
  const percentInput = Number(formData.get('percent'));
  // UI pide % humano: 0.5 → 0.005
  if (!Number.isFinite(percentInput) || percentInput < 0 || percentInput > 100) {
    return { ok: false, message: 'Porcentaje inválido' };
  }
  const percentage = percentInput / 100;
  const minimum = Number(formData.get('minimum') || 0);
  const maximumRaw = formData.get('maximum');
  const maximum =
    maximumRaw === null || String(maximumRaw).trim() === ''
      ? null
      : Number(maximumRaw);

  const supabase = await createClient();
  const { error } = await supabase.rpc('update_active_commission_percentage', {
    p_percentage: percentage,
    p_minimum_commission: Number.isFinite(minimum) ? minimum : 0,
    p_maximum_commission: maximum != null && Number.isFinite(maximum) ? maximum : null,
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath('/finance');
  return { ok: true, message: 'Regla de comisión actualizada.' };
}
