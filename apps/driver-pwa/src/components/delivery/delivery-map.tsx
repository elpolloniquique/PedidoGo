'use client';

import { MapView, formatDistance, formatDuration, getRoute, type RouteGeometry } from '@pedidosgo/maps';
import { useEffect, useState } from 'react';

type Props = {
  branchLat: number | null;
  branchLng: number | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  branchLabel?: string;
  deliveryLabel?: string;
  height?: string;
  showRoute?: boolean;
};

export function DeliveryMap({
  branchLat,
  branchLng,
  deliveryLat,
  deliveryLng,
  driverLat = null,
  driverLng = null,
  branchLabel = 'Local',
  deliveryLabel = 'Entrega',
  height = '240px',
  showRoute = true,
}: Props) {
  const [route, setRoute] = useState<RouteGeometry | null>(null);
  const [stats, setStats] = useState<string | null>(null);

  const hasBranch = branchLat != null && branchLng != null;
  const hasDelivery = deliveryLat != null && deliveryLng != null;
  const hasDriver = driverLat != null && driverLng != null;

  useEffect(() => {
    if (!showRoute || !hasBranch || !hasDelivery) return;
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
  }, [showRoute, hasBranch, hasDelivery, branchLat, branchLng, deliveryLat, deliveryLng]);

  if (!hasBranch && !hasDelivery && !hasDriver) {
    return (
      <p className="text-xs text-slate-500">Sin coordenadas de mapa para este pedido.</p>
    );
  }

  const markers = [];
  if (hasBranch) {
    markers.push({
      id: 'branch',
      latitude: branchLat!,
      longitude: branchLng!,
      label: branchLabel,
      color: '#B45309',
    });
  }
  if (hasDelivery) {
    markers.push({
      id: 'delivery',
      latitude: deliveryLat!,
      longitude: deliveryLng!,
      label: deliveryLabel,
      color: '#0F766E',
    });
  }
  if (hasDriver) {
    markers.push({
      id: 'driver',
      latitude: driverLat!,
      longitude: driverLng!,
      label: 'Tú',
      color: '#2563EB',
    });
  }

  return (
    <div className="space-y-1">
      {stats ? <p className="text-xs text-slate-600">{stats}</p> : null}
      <MapView markers={markers} routeGeometry={route} height={height} />
    </div>
  );
}
