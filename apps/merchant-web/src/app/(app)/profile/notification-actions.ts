'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type PrefsResult = { ok: true } | { ok: false; message: string };

export async function saveNotificationPrefsAction(formData: FormData): Promise<PrefsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'No autenticado' };

  const { error } = await supabase.rpc('set_my_notification_preferences', {
    p_email_enabled: formData.get('email_enabled') === 'on',
    p_in_app_enabled: formData.get('in_app_enabled') === 'on',
    p_sound_enabled: formData.get('sound_enabled') === 'on',
    p_vibration_enabled: formData.get('vibration_enabled') === 'on',
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath('/profile');
  return { ok: true };
}
