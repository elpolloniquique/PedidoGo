'use server';

import { revalidatePath } from 'next/cache';
import { requireMerchantContext } from '@/lib/merchant';
import { createClient } from '@/lib/supabase/server';

export type ActionResult =
  | { ok: true; message?: string; apiKey?: string; prefix?: string }
  | { ok: false; message: string };

export async function createApiKeyAction(formData: FormData): Promise<ActionResult> {
  await requireMerchantContext();
  const name = String(formData.get('name') || 'default');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_merchant_api_key', { p_name: name });
  if (error) return { ok: false, message: error.message };
  const row = data as { api_key?: string; prefix?: string } | null;
  revalidatePath('/api-keys');
  return {
    ok: true,
    message: 'API key creada. Copiála ahora; no se vuelve a mostrar.',
    apiKey: row?.api_key,
    prefix: row?.prefix,
  };
}

export async function revokeApiKeyAction(keyId: string): Promise<ActionResult> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc('revoke_merchant_api_key', { p_key_id: keyId });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/api-keys');
  return { ok: true, message: 'API key revocada.' };
}
