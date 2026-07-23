import type { UserRole } from '@pedidosgo/types';

/**
 * Autorización RapideX.
 * Nunca confiar solo en el rol enviado por el navegador:
 * los roles se leen desde Supabase (user_roles) vía RPC / RLS.
 */

export const ALL_ROLES: readonly UserRole[] = [
  'super_admin',
  'platform_admin',
  'merchant_owner',
  'merchant_admin',
  'merchant_operator',
  'driver',
  'customer',
  'support_agent',
] as const;

/** Roles que puede elegir un usuario al registrarse públicamente */
export const SELF_REGISTER_ROLES: readonly UserRole[] = [
  'driver',
  'merchant_owner',
  'customer',
] as const;

export type PedidosGoApp = 'admin-web' | 'merchant-web' | 'driver-pwa' | 'customer-tracking';

export const APP_ALLOWED_ROLES: Record<PedidosGoApp, readonly UserRole[]> = {
  'admin-web': ['super_admin', 'platform_admin'],
  'merchant-web': ['merchant_owner', 'merchant_admin', 'merchant_operator'],
  'driver-pwa': ['driver'],
  'customer-tracking': ['customer', 'super_admin', 'platform_admin'],
};

export function hasRole(userRoles: UserRole[], required: UserRole | UserRole[]): boolean {
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((role) => userRoles.includes(role));
}

export function hasAnyRole(userRoles: string[], allowed: readonly UserRole[]): boolean {
  return userRoles.some((role) => allowed.includes(role as UserRole));
}

export function isDriverRole(roles: UserRole[]): boolean {
  return roles.includes('driver');
}

export function isMerchantRole(roles: UserRole[]): boolean {
  return roles.some(
    (r) => r === 'merchant_owner' || r === 'merchant_admin' || r === 'merchant_operator',
  );
}

export function isAdminRole(roles: UserRole[]): boolean {
  return roles.some((r) => r === 'super_admin' || r === 'platform_admin');
}

export function canAccessApp(app: PedidosGoApp, userRoles: string[]): boolean {
  return hasAnyRole(userRoles, APP_ALLOWED_ROLES[app]);
}

export function parseRoles(value: unknown): UserRole[] {
  if (!Array.isArray(value)) return [];
  return value.filter((r): r is UserRole =>
    typeof r === 'string' && (ALL_ROLES as readonly string[]).includes(r),
  );
}

export type AuthProfile = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  roles: UserRole[];
};
