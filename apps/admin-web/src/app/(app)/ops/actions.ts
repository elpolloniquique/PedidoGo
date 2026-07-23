'use server';

import { revalidatePath } from 'next/cache';
import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export async function toggleFeatureFlagAction(
  key: string,
  enabled: boolean,
): Promise<ActionResult> {
  await requireAppUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_feature_flag', {
    p_key: key,
    p_enabled: enabled,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/ops');
  return { ok: true, message: `Flag ${key} → ${enabled ? 'ON' : 'OFF'}` };
}

export async function updateSettingAction(formData: FormData): Promise<ActionResult> {
  await requireAppUser();
  const key = String(formData.get('key') || '');
  const value = String(formData.get('value') || '');
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_app_setting', {
    p_key: key,
    p_value: value,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/ops');
  return { ok: true, message: `Setting ${key} actualizado.` };
}
