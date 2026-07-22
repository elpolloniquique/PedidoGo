import {
  APP_ALLOWED_ROLES,
  canAccessApp,
  parseRoles,
  type AuthProfile,
  type PedidosGoApp,
} from '@pedidosgo/auth';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

const APP: PedidosGoApp = 'driver-pwa';

export async function getAuthProfile(): Promise<AuthProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: rolesData } = await supabase.rpc('get_my_roles');
  const roles = parseRoles(rolesData);

  const { data: profileRows } = await supabase.rpc('get_my_profile');
  const profile = Array.isArray(profileRows) ? profileRows[0] : profileRows;

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? null,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    phone: profile?.phone ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    isActive: profile?.is_active ?? true,
    roles,
  };
}

export async function requireAppUser(): Promise<AuthProfile> {
  const profile = await getAuthProfile();
  if (!profile) redirect('/login');
  if (!profile.isActive) redirect('/login?error=inactive');
  if (!canAccessApp(APP, profile.roles)) redirect('/login?error=forbidden');
  return profile;
}

export function getAllowedRoles() {
  return APP_ALLOWED_ROLES[APP];
}
