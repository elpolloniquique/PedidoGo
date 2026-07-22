import type { GeoPoint } from '@pedidosgo/types';

/** Token público (pk.) para el navegador. Nunca expongas sk. en el cliente. */
export function getMapboxPublicToken(): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token || !token.startsWith('pk.')) return null;
  return token;
}

/**
 * Token para llamadas server-side.
 * Prefiere MAPBOX_SECRET_TOKEN (sk.); si no hay, usa el público.
 */
export function getMapboxServerToken(): string | null {
  const secret = process.env.MAPBOX_SECRET_TOKEN?.trim();
  if (secret && secret.startsWith('sk.')) return secret;
  return getMapboxPublicToken();
}

export function hasMapboxPublicToken(): boolean {
  return Boolean(getMapboxPublicToken());
}

export type { GeoPoint };
