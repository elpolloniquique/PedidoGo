import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js';

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function findAuthUserByEmail(
  admin: ReturnType<typeof createServiceRoleClient>,
  email: string,
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => (u.email ?? '').toLowerCase() === normalized);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
    if (page > 20) return null;
  }
}

export async function confirmAuthUserEmail(
  admin: ReturnType<typeof createServiceRoleClient>,
  email: string,
): Promise<boolean> {
  const user = await findAuthUserByEmail(admin, email);
  if (!user) return false;
  if (user.email_confirmed_at) return true;
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });
  if (error) throw error;
  return true;
}
