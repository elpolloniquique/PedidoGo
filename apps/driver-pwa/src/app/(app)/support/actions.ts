'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAppUser } from '@/lib/auth';

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; message: string };

export async function createTicketAction(formData: FormData): Promise<ActionResult> {
  await requireAppUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_support_ticket', {
    p_subject: String(formData.get('subject') || ''),
    p_message: String(formData.get('message') || ''),
    p_priority: String(formData.get('priority') || 'normal'),
  });
  if (error) return { ok: false, message: error.message };
  const id = data as string;
  revalidatePath('/support');
  redirect(`/support/${id}`);
}

export async function addMessageAction(ticketId: string, formData: FormData): Promise<ActionResult> {
  await requireAppUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc('add_support_message', {
    p_ticket_id: ticketId,
    p_message: String(formData.get('message') || ''),
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/support/${ticketId}`);
  revalidatePath('/support');
  return { ok: true, message: 'Mensaje enviado.' };
}

export async function setTicketStatusAction(
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
): Promise<ActionResult> {
  await requireAppUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_support_ticket_status', {
    p_ticket_id: ticketId,
    p_status: status,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/support/${ticketId}`);
  revalidatePath('/support');
  return { ok: true, message: 'Estado actualizado.' };
}
