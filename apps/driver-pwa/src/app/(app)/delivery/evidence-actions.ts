'use server';

import { revalidatePath } from 'next/cache';
import { requireDriver } from '@/lib/driver';
import { createClient } from '@/lib/supabase/server';

export type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; message: string };

export async function uploadDeliveryEvidenceAction(
  formData: FormData,
): Promise<ActionResult> {
  const { profile } = await requireDriver();
  const deliveryRequestId = String(formData.get('deliveryRequestId') || '');
  const evidenceType = String(formData.get('evidenceType') || 'photo_delivery');
  const file = formData.get('file');

  if (!deliveryRequestId) {
    return { ok: false, message: 'Falta el id de la entrega.' };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Selecciona una foto.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, message: 'La foto no puede superar 10 MB.' };
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return { ok: false, message: 'Usa JPG, PNG o WEBP.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${profile.id}/${deliveryRequestId}_${Date.now()}.${ext}`;

  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('delivery-evidence')
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { data, error } = await supabase.rpc('register_delivery_evidence', {
    p_delivery_request_id: deliveryRequestId,
    p_storage_path: path,
    p_evidence_type: evidenceType,
    p_metadata: { content_type: file.type, size: file.size },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/delivery');
  return { ok: true, message: 'Evidencia subida.', id: data as string };
}
