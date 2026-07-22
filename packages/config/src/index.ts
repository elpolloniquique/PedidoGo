/**
 * Configuración central de marca PedidosGo.
 * En Fase 2 estos valores también vivirán en la tabla app_settings.
 * Evitar hardcodear el nombre en decenas de archivos.
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
  appName: readEnv('NEXT_PUBLIC_APP_NAME', 'PedidosGo'),
  appShortName: readEnv('NEXT_PUBLIC_APP_SHORT_NAME', 'PedidosGo'),
  appDescription: readEnv(
    'NEXT_PUBLIC_APP_DESCRIPTION',
    'Plataforma inteligente de delivery para comercios y repartidores',
  ),
  appLogoUrl: readEnv('NEXT_PUBLIC_APP_LOGO_URL', ''),
  appPrimaryColor: readEnv('NEXT_PUBLIC_APP_PRIMARY_COLOR', '#0F766E'),
  appSecondaryColor: readEnv('NEXT_PUBLIC_APP_SECONDARY_COLOR', '#134E4A'),
  appSupportEmail: readEnv('NEXT_PUBLIC_APP_SUPPORT_EMAIL', 'soporte@pedidosgo.cl'),
  appSupportPhone: readEnv('NEXT_PUBLIC_APP_SUPPORT_PHONE', ''),
  appDomain: readEnv('NEXT_PUBLIC_APP_DOMAIN', 'pedidosgo.cl'),
};

export const appPorts = {
  adminWeb: 3001,
  merchantWeb: 3002,
  driverPwa: 3003,
  customerTracking: 3004,
} as const;
