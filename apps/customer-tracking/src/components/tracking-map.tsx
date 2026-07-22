'use client';

import { MapView, formatDistance, formatDuration, getRoute, type RouteGeometry } from '@pedidosgo/maps';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  branchLat: number | null;
  branchLng: number | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  branchLabel?: string;
  deliveryLabel?: string;
  showDriver?: boolean;
  height?: string;
};

export function TrackingMap({
  branchLat,
  branchLng,
  deliveryLat,
  deliveryLng,
  driverLat = null,
  driverLng = null,
  branchLabel = 'Local',
  deliveryLabel = 'Tu dirección',
  showDriver = false,
  height = '280px',
}: Props) {
  const [route, setRoute] = useState<RouteGeometry | null>(null);
  const [stats, setStats] = useState<string | null>(null);

  const hasBranch = branchLat != null && branchLng != null;
  const hasDelivery = deliveryLat != null && deliveryLng != null;
  const hasDriver = showDriver && driverLat != null && driverLng != null;

  useEffect(() => {
    if (!hasBranch || !hasDelivery) return;
    let cancelled = false;
    void (async () => {
      const result = await getRoute(
        { latitude: branchLat!, longitude: branchLng! },
        { latitude: deliveryLat!, longitude: deliveryLng! },
      );
      if (cancelled || !result) return;
      setRoute(result.geometry);
      setStats(
        `${formatDistance(result.distanceMeters)} · ${formatDuration(result.durationSeconds)}`,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [hasBranch, hasDelivery, branchLat, branchLng, deliveryLat, deliveryLng]);

  const markers = useMemo(() => {
    const list = [];
    if (hasBranch) {
      list.push({
        id: 'branch',
        latitude: branchLat!,
        longitude: branchLng!,
        label: branchLabel,
        color: '#B45309',
      });
    }
    if (hasDelivery) {
      list.push({
        id: 'delivery',
        latitude: deliveryLat!,
        longitude: deliveryLng!,
        label: deliveryLabel,
        color: '#0F766E',
      });
    }
    if (hasDriver) {
      list.push({
        id: 'driver',
        latitude: driverLat!,
        longitude: driverLng!,
        label: 'Repartidor',
        color: '#2563EB',
      });
    }
    return list;
  }, [
    hasBranch,
    hasDelivery,
    hasDriver,
    branchLat,
    branchLng,
    deliveryLat,
    deliveryLng,
    driverLat,
    driverLng,
    branchLabel,
    deliveryLabel,
  ]);

  if (!hasBranch && !hasDelivery && !hasDriver) {
    return (
      <p className="text-sm text-slate-500">Aún no hay coordenadas para mostrar en el mapa.</p>
    );
  }

  return (
    <div className="space-y-2">
      {stats ? <p className="text-xs text-slate-600">{stats}</p> : null}
      <MapView markers={markers} routeGeometry={route} height={height} />
    </div>
  );
}
