import type { GeoPoint } from '@pedidosgo/types';
import { getMapboxPublicToken, getMapboxServerToken } from './config';

export type RouteGeometry = {
  type: 'LineString';
  coordinates: [number, number][];
};

export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: RouteGeometry | null;
};

export async function getRoute(
  from: GeoPoint,
  to: GeoPoint,
  profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling' = 'driving',
): Promise<RouteResult | null> {
  const token = getMapboxPublicToken() ?? getMapboxServerToken();
  if (!token) return null;

  const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}`,
  );
  url.searchParams.set('access_token', token);
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('overview', 'full');
  url.searchParams.set('language', 'es');

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const json = (await res.json()) as {
    routes?: {
      distance: number;
      duration: number;
      geometry?: RouteGeometry;
    }[];
  };
  const route = json.routes?.[0];
  if (!route) return null;

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry ?? null,
  };
}

export async function getRouteDistance(
  from: GeoPoint,
  to: GeoPoint,
): Promise<number | null> {
  const route = await getRoute(from, to);
  return route?.distanceMeters ?? null;
}

export async function getEstimatedDuration(
  from: GeoPoint,
  to: GeoPoint,
): Promise<number | null> {
  const route = await getRoute(from, to);
  return route?.durationSeconds ?? null;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
