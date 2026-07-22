'use server';

import { revalidatePath } from 'next/cache';
import { requireDriver } from '@/lib/driver';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export async function submitPaymentAction(formData: FormData): Promise<ActionResult> {
  const { driver } = await requireDriver();
  if (driver.status !== 'approved') {
    return { ok: false, message: 'Debes estar aprobado.' };
  }

  const amount = Number(formData.get('amount'));
  const notes = String(formData.get('notes') || '');
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Ingresa un monto válido' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_commission_payment', {
    p_amount: amount,
    p_notes: notes || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/wallet');
  return { ok: true, message: 'Pago enviado a revisión.' };
}
