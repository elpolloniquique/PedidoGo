import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js';
import { createServiceRoleClient } from './service';

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

// re-export for convenience
export { createServiceRoleClient, createSupabaseClient };
