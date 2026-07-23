import type { SupabaseClient } from '@supabase/supabase-js';

/** Asegura rol driver + filas drivers/availability/wallet (idempotente). */
export async function ensureDriverBootstrap(
  admin: SupabaseClient,
  userId: string,
  meta?: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
    email?: string;
  },
): Promise<void> {
  if (meta?.email) {
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
  }

  const { data: role, error: roleError } = await admin
    .from('roles')
    .select('id')
    .eq('slug', 'driver')
    .maybeSingle();

  if (roleError) throw roleError;
  if (!role?.id) throw new Error('Rol driver no encontrado');

  const { error: urError } = await admin.from('user_roles').upsert(
    { user_id: userId, role_id: role.id },
    { onConflict: 'user_id,role_id' },
  );
  if (urError) throw urError;

  const { data: driver, error: driverError } = await admin
    .from('drivers')
    .upsert({ user_id: userId, status: 'draft' }, { onConflict: 'user_id' })
    .select('id')
    .maybeSingle();

  if (driverError) throw driverError;

  let driverId = driver?.id as string | undefined;
  if (!driverId) {
    const { data: existing } = await admin
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    driverId = existing?.id;
  }
  if (!driverId) throw new Error('No se pudo crear el repartidor');

  await admin
    .from('driver_availability')
    .upsert({ driver_id: driverId, status: 'offline' }, { onConflict: 'driver_id' });

  await admin.from('driver_wallets').upsert({ driver_id: driverId }, { onConflict: 'driver_id' });

  await admin.from('notification_preferences').upsert(
    { user_id: userId },
    { onConflict: 'user_id' },
  );
}
