import type { GeoPoint } from '@pedidosgo/types';
import { getMapboxPublicToken, getMapboxServerToken } from './config';

export type GeocodeResult = {
  point: GeoPoint;
  placeName: string;
  addressLine: string | null;
  commune: string | null;
  city: string | null;
  region: string | null;
};

const SANTIAGO_PROXIMITY = '-70.6693,-33.4489';

type MapboxFeature = {
  id: string;
  place_name: string;
  center: [number, number];
  text?: string;
  context?: { id: string; text: string }[];
};

function contextValue(feature: MapboxFeature, prefix: string): string | null {
  const hit = feature.context?.find((c) => c.id.startsWith(prefix));
  return hit?.text ?? null;
}

function mapFeature(feature: MapboxFeature): GeocodeResult {
  const [longitude, latitude] = feature.center;
  return {
    point: { latitude, longitude },
    placeName: feature.place_name,
    addressLine: feature.text ?? feature.place_name,
    commune: contextValue(feature, 'place.') ?? contextValue(feature, 'locality.'),
    city: contextValue(feature, 'place.') ?? contextValue(feature, 'district.'),
    region: contextValue(feature, 'region.'),
  };
}

async function forwardGeocode(
  query: string,
  token: string,
  limit = 5,
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
  );
  url.searchParams.set('access_token', token);
  url.searchParams.set('country', 'cl');
  url.searchParams.set('language', 'es');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('proximity', SANTIAGO_PROXIMITY);
  url.searchParams.set('types', 'address,poi,place,locality,neighborhood');

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const json = (await res.json()) as { features?: MapboxFeature[] };
  return (json.features ?? []).map(mapFeature);
}

/** Geocodificación (cliente o servidor). Usa token público si está disponible. */
export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const token = getMapboxPublicToken() ?? getMapboxServerToken();
  if (!token) return null;
  const results = await forwardGeocode(address, token, 1);
  return results[0]?.point ?? null;
}

export async function searchAddresses(
  query: string,
  options?: { limit?: number; server?: boolean },
): Promise<GeocodeResult[]> {
  const token = options?.server
    ? getMapboxServerToken()
    : getMapboxPublicToken() ?? getMapboxServerToken();
  if (!token) return [];
  return forwardGeocode(query, token, options?.limit ?? 5);
}

export async function reverseGeocode(point: GeoPoint): Promise<string | null> {
  const token = getMapboxPublicToken() ?? getMapboxServerToken();
  if (!token) return null;

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${point.longitude},${point.latitude}.json`,
  );
  url.searchParams.set('access_token', token);
  url.searchParams.set('language', 'es');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const json = (await res.json()) as { features?: MapboxFeature[] };
  return json.features?.[0]?.place_name ?? null;
}

export async function validateDeliveryAddress(address: string): Promise<boolean> {
  const point = await geocodeAddress(address);
  return point !== null;
}
