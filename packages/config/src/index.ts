/**
 * Configuración central de marca RapideX.
 * También en app_settings (Supabase). Evitar hardcodear el nombre en la UI.
 */

export type AppBrandConfig = {
  appName: string;
  appShortName: string;
  appDescription: string;
  appLogoUrl: string;
  appPrimaryColor: string;
  appSecondaryColor: string;
  appSupportEmail: string;
  appSupportPhone: string;
  appDomain: string;
};

const readEnv = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export const brandConfig: AppBrandConfig = {
  appName: readEnv('NEXT_PUBLIC_APP_NAME', 'RapideX'),
  appShortName: readEnv('NEXT_PUBLIC_APP_SHORT_NAME', 'RapideX'),
  appDescription: readEnv(
    'NEXT_PUBLIC_APP_DESCRIPTION',
    'Plataforma inteligente de delivery para comercios y repartidores',
  ),
  appLogoUrl: readEnv('NEXT_PUBLIC_APP_LOGO_URL', ''),
  appPrimaryColor: readEnv('NEXT_PUBLIC_APP_PRIMARY_COLOR', '#0F766E'),
  appSecondaryColor: readEnv('NEXT_PUBLIC_APP_SECONDARY_COLOR', '#134E4A'),
  appSupportEmail: readEnv('NEXT_PUBLIC_APP_SUPPORT_EMAIL', 'soporte@rapidex.cl'),
  appSupportPhone: readEnv('NEXT_PUBLIC_APP_SUPPORT_PHONE', ''),
  appDomain: readEnv('NEXT_PUBLIC_APP_DOMAIN', 'rapidex.cl'),
};

export const appPorts = {
  adminWeb: 3001,
  merchantWeb: 3002,
  driverPwa: 3003,
  customerTracking: 3004,
} as const;

export {
  buildSecurityHeaderRoutes,
  getSecurityHeaders,
  type NextHeaderRoute,
  type SecurityHeader,
} from './security-headers';
