'use client';

import { MapView, formatDistance, formatDuration, getRoute, type RouteGeometry } from '@pedidosgo/maps';
import { useEffect, useState } from 'react';
import { useOrderRealtime } from '@/lib/realtime';

export type OrderMapPoints = {
  deliveryLat: number | null;
  deliveryLng: number | null;
  branchLat: number | null;
  branchLng: number | null;
  branchName: string | null;
  deliveryAddress: string | null;
};

export type DriverLivePoint = {
  lat: number;
  lng: number;
  recordedAt: string | null;
};

export function OrderMapPanel({
  points,
  orderId,
  deliveryRequestId,
  driverId,
  initialDriver,
}: {
  points: OrderMapPoints;
  orderId: string;
  deliveryRequestId?: string | null;
  driverId?: string | null;
  initialDriver?: DriverLivePoint | null;
}) {
  const [route, setRoute] = useState<RouteGeometry | null>(null);
  const [stats, setStats] = useState<string | null>(null);
  const [driver, setDriver] = useState<DriverLivePoint | null>(initialDriver ?? null);

  useOrderRealtime({
    orderId,
    deliveryRequestId,
    driverId,
    refreshOnChange: true,
    onDriverLocation: (point) => {
      setDriver({
        lat: point.lat,
        lng: point.lng,
        recordedAt: point.recordedAt,
      });
    },
  });

  const hasDelivery =
    points.deliveryLat != null &&
    points.deliveryLng != null &&
    Number.isFinite(points.deliveryLat) &&
    Number.isFinite(points.deliveryLng);
  const hasBranch =
    points.branchLat != null &&
    points.branchLng != null &&
    Number.isFinite(points.branchLat) &&
    Number.isFinite(points.branchLng);

  useEffect(() => {
    if (!hasDelivery || !hasBranch) return;
    let cancelled = false;
    void (async () => {
      const result = await getRoute(
        { latitude: points.branchLat!, longitude: points.branchLng! },
        { latitude: points.deliveryLat!, longitude: points.deliveryLng! },
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
  }, [
    hasDelivery,
    hasBranch,
    points.branchLat,
    points.branchLng,
    points.deliveryLat,
    points.deliveryLng,
  ]);

  if (!hasDelivery && !hasBranch && !driver) {
    return (
      <p className="text-sm text-slate-500">
        Sin coordenadas. Usa la búsqueda de dirección al crear el pedido o geocodifica la sucursal.
      </p>
    );
  }

  const markers = [];
  if (hasBranch) {
    markers.push({
      id: 'branch',
      latitude: points.branchLat!,
      longitude: points.branchLng!,
      label: points.branchName ?? 'Sucursal',
      color: '#B45309',
    });
  }
  if (hasDelivery) {
    markers.push({
      id: 'delivery',
      latitude: points.deliveryLat!,
      longitude: points.deliveryLng!,
      label: points.deliveryAddress ?? 'Entrega',
      color: '#0F766E',
    });
  }
  if (driver) {
    markers.push({
      id: 'driver',
      latitude: driver.lat,
      longitude: driver.lng,
      label: 'Repartidor',
      color: '#2563EB',
    });
  }

  return (
    <div className="space-y-2">
      {stats ? <p className="text-sm text-slate-600">Ruta estimada: {stats}</p> : null}
      {driver ? (
        <p className="text-xs text-slate-500">
          GPS repartidor en vivo
          {driver.recordedAt
            ? `: ${new Date(driver.recordedAt).toLocaleTimeString('es-CL')}`
            : ''}
        </p>
      ) : driverId ? (
        <p className="text-xs text-slate-500">Esperando señal GPS del repartidor…</p>
      ) : null}
      <MapView markers={markers} routeGeometry={route} height="300px" />
    </div>
  );
}
