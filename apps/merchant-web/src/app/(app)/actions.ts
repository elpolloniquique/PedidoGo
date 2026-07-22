'use server';

import {
  branchHoursSchema,
  branchSettingsSchema,
  branchUpsertSchema,
  merchantUpdateSchema,
  merchantUserInviteSchema,
} from '@pedidosgo/validation';
import { revalidatePath } from 'next/cache';
import { requireAppUser } from '@/lib/auth';
import { requireMerchantContext } from '@/lib/merchant';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; message: string };

function parseBool(value: FormDataEntryValue | null): boolean {
  return value === 'true' || value === 'on' || value === '1';
}

export async function bootstrapMerchantAction(formData: FormData): Promise<ActionResult> {
  await requireAppUser();
  const name = String(formData.get('name') || 'Mi comercio');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('bootstrap_my_merchant', { p_name: name });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/');
  revalidatePath('/onboarding');
  return { ok: true, message: 'Comercio creado.', id: data as string };
}

export async function linkDemoMerchantAction(): Promise<ActionResult> {
  await requireAppUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('link_demo_merchant_el_pollon');

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/');
  revalidatePath('/onboarding');
  return { ok: true, message: 'Vinculado a Pollería El Pollón.', id: data as string };
}

export async function updateMerchantAction(formData: FormData): Promise<ActionResult> {
  const { merchant } = await requireMerchantContext();

  const parsed = merchantUpdateSchema.safeParse({
    name: formData.get('name'),
    legalName: formData.get('legalName') || undefined,
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    websiteUrl: formData.get('websiteUrl') || '',
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('merchants')
    .update({
      name: parsed.data.name,
      legal_name: parsed.data.legalName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      website_url: parsed.data.websiteUrl || null,
    })
    .eq('id', merchant.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/');
  revalidatePath('/merchant');
  return { ok: true, message: 'Comercio actualizado.' };
}

export async function createBranchAction(formData: FormData): Promise<ActionResult> {
  const { merchant } = await requireMerchantContext();

  const parsed = branchUpsertSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code') || undefined,
    addressLine: formData.get('addressLine'),
    city: formData.get('city'),
    commune: formData.get('commune'),
    region: formData.get('region') || undefined,
    phone: formData.get('phone') || '',
    isActive: true,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { data: branch, error } = await supabase
    .from('branches')
    .insert({
      merchant_id: merchant.id,
      name: parsed.data.name,
      code: parsed.data.code || null,
      address_line: parsed.data.addressLine,
      city: parsed.data.city,
      commune: parsed.data.commune,
      region: parsed.data.region || null,
      phone: parsed.data.phone || null,
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !branch) {
    return { ok: false, message: error?.message ?? 'No se pudo crear la sucursal' };
  }

  await supabase.from('branch_settings').insert({
    branch_id: branch.id,
    delivery_dispatch_mode: 'manual',
  });

  await supabase.from('branch_hours').insert(
    Array.from({ length: 7 }, (_, day) => ({
      branch_id: branch.id,
      day_of_week: day,
      opens_at: '10:00',
      closes_at: '22:00',
      is_closed: false,
    })),
  );

  const lat = Number(formData.get('latitude'));
  const lng = Number(formData.get('longitude'));
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    await supabase.rpc('set_branch_location', {
      p_branch_id: branch.id,
      p_lat: lat,
      p_lng: lng,
    });
  }

  revalidatePath('/branches');
  revalidatePath('/');
  return { ok: true, message: 'Sucursal creada.', id: branch.id };
}

export async function updateBranchAction(
  branchId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { merchant } = await requireMerchantContext();

  const parsed = branchUpsertSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code') || undefined,
    addressLine: formData.get('addressLine'),
    city: formData.get('city'),
    commune: formData.get('commune'),
    region: formData.get('region') || undefined,
    phone: formData.get('phone') || '',
    isActive: parseBool(formData.get('isActive')),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('branches')
    .update({
      name: parsed.data.name,
      code: parsed.data.code || null,
      address_line: parsed.data.addressLine,
      city: parsed.data.city,
      commune: parsed.data.commune,
      region: parsed.data.region || null,
      phone: parsed.data.phone || null,
      is_active: parsed.data.isActive ?? true,
    })
    .eq('id', branchId)
    .eq('merchant_id', merchant.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  const lat = Number(formData.get('latitude'));
  const lng = Number(formData.get('longitude'));
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    await supabase.rpc('set_branch_location', {
      p_branch_id: branchId,
      p_lat: lat,
      p_lng: lng,
    });
  }

  revalidatePath('/branches');
  revalidatePath(`/branches/${branchId}`);
  revalidatePath('/');
  return { ok: true, message: 'Sucursal actualizada.' };
}

export async function updateBranchSettingsAction(
  branchId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireMerchantContext();

  const parsed = branchSettingsSchema.safeParse({
    deliveryDispatchMode: formData.get('deliveryDispatchMode'),
    autoSelectionStrategy: formData.get('autoSelectionStrategy'),
    defaultSearchRadiusKm: formData.get('defaultSearchRadiusKm'),
    offerTimeoutSeconds: formData.get('offerTimeoutSeconds'),
    allowDriverOffers: parseBool(formData.get('allowDriverOffers')),
    allowFixedFare: parseBool(formData.get('allowFixedFare')),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('branch_settings')
    .update({
      delivery_dispatch_mode: parsed.data.deliveryDispatchMode,
      auto_selection_strategy: parsed.data.autoSelectionStrategy,
      default_search_radius_km: parsed.data.defaultSearchRadiusKm,
      offer_timeout_seconds: parsed.data.offerTimeoutSeconds,
      allow_driver_offers: parsed.data.allowDriverOffers,
      allow_fixed_fare: parsed.data.allowFixedFare,
    })
    .eq('branch_id', branchId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/branches/${branchId}/settings`);
  revalidatePath(`/branches/${branchId}`);
  return { ok: true, message: 'Configuración guardada.' };
}

export async function updateBranchHoursAction(
  branchId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireMerchantContext();

  const hours = Array.from({ length: 7 }, (_, day) => ({
    dayOfWeek: day,
    opensAt: String(formData.get(`opensAt_${day}`) || '10:00'),
    closesAt: String(formData.get(`closesAt_${day}`) || '22:00'),
    isClosed: parseBool(formData.get(`isClosed_${day}`)),
  }));

  const parsed = branchHoursSchema.safeParse(hours);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Horarios inválidos' };
  }

  const supabase = await createClient();
  const rows = parsed.data.map((h) => ({
    branch_id: branchId,
    day_of_week: h.dayOfWeek,
    opens_at: h.opensAt,
    closes_at: h.closesAt,
    is_closed: h.isClosed,
  }));

  const { error } = await supabase.from('branch_hours').upsert(rows, {
    onConflict: 'branch_id,day_of_week',
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/branches/${branchId}/hours`);
  revalidatePath(`/branches/${branchId}`);
  return { ok: true, message: 'Horarios guardados.' };
}

export async function inviteMerchantUserAction(formData: FormData): Promise<ActionResult> {
  const { membershipRole } = await requireMerchantContext();

  if (membershipRole !== 'owner' && membershipRole !== 'admin') {
    return { ok: false, message: 'Solo el dueño o admin del comercio puede agregar usuarios.' };
  }

  const parsed = merchantUserInviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
    branchId: formData.get('branchId') || '',
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('link_merchant_user_by_email', {
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_branch_id: parsed.data.branchId || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/users');
  return { ok: true, message: 'Usuario vinculado al comercio.' };
}

export async function setMerchantUserActiveAction(
  memberId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { membershipRole, profile } = await requireMerchantContext();

  if (membershipRole !== 'owner') {
    return { ok: false, message: 'Solo el dueño puede activar o desactivar usuarios.' };
  }

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('merchant_users')
    .select('id, user_id, role')
    .eq('id', memberId)
    .maybeSingle();

  if (!member) {
    return { ok: false, message: 'Miembro no encontrado.' };
  }

  if (member.user_id === profile.id) {
    return { ok: false, message: 'No puedes desactivarte a ti mismo.' };
  }

  if (member.role === 'owner') {
    return { ok: false, message: 'No puedes desactivar al dueño.' };
  }

  const { error } = await supabase
    .from('merchant_users')
    .update({ is_active: isActive })
    .eq('id', memberId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/users');
  return { ok: true, message: isActive ? 'Usuario activado.' : 'Usuario desactivado.' };
}
