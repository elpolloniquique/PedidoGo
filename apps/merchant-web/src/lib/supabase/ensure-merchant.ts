import type { SupabaseClient } from '@supabase/supabase-js';

/** Asegura rol merchant_owner + comercio/sucursal (idempotente). */
export async function ensureMerchantBootstrap(
  admin: SupabaseClient,
  userId: string,
  meta: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string | null;
  },
): Promise<void> {
  await admin.from('profiles').upsert(
    {
      id: userId,
      email: meta.email,
      first_name: meta.first_name ?? null,
      last_name: meta.last_name ?? null,
      phone: meta.phone ?? null,
    },
    { onConflict: 'id' },
  );

  const { data: role, error: roleError } = await admin
    .from('roles')
    .select('id')
    .eq('slug', 'merchant_owner')
    .maybeSingle();

  if (roleError) throw roleError;
  if (!role?.id) throw new Error('Rol merchant_owner no encontrado');

  const { error: urError } = await admin.from('user_roles').upsert(
    { user_id: userId, role_id: role.id },
    { onConflict: 'user_id,role_id' },
  );
  if (urError) throw urError;

  // ¿Ya tiene comercio?
  const { data: existingMember } = await admin
    .from('merchant_users')
    .select('id, merchant_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (existingMember?.merchant_id) {
    await admin.from('notification_preferences').upsert(
      { user_id: userId },
      { onConflict: 'user_id' },
    );
    return;
  }

  const displayName =
    [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() || 'Mi comercio';

  const { data: merchant, error: merchantError } = await admin
    .from('merchants')
    .insert({
      name: displayName,
      email: meta.email,
      phone: meta.phone ?? null,
      is_active: true,
      is_approved: true,
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (merchantError) throw merchantError;

  const { error: muError } = await admin.from('merchant_users').insert({
    merchant_id: merchant.id,
    user_id: userId,
    role: 'owner',
    is_active: true,
  });
  if (muError) throw muError;

  const { data: branch, error: branchError } = await admin
    .from('branches')
    .insert({
      merchant_id: merchant.id,
      name: 'Sucursal principal',
      code: 'SUC-01',
      address_line: 'Dirección por configurar',
      city: 'Santiago',
      commune: 'Santiago',
      region: 'Región Metropolitana',
      is_active: true,
    })
    .select('id')
    .single();

  if (branchError) throw branchError;

  await admin.from('branch_settings').upsert(
    { branch_id: branch.id, delivery_dispatch_mode: 'manual' },
    { onConflict: 'branch_id' },
  );

  const hours = Array.from({ length: 7 }, (_, day) => ({
    branch_id: branch.id,
    day_of_week: day,
    opens_at: '10:00',
    closes_at: '22:00',
    is_closed: false,
  }));
  await admin.from('branch_hours').upsert(hours, {
    onConflict: 'branch_id,day_of_week',
  });

  await admin.from('notification_preferences').upsert(
    { user_id: userId },
    { onConflict: 'user_id' },
  );
}
