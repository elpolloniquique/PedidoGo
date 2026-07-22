'use client';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import { getMapboxPublicToken } from '../config';
import type { RouteGeometry } from '../directions';

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  color?: string;
};

export type MapViewProps = {
  markers?: MapMarker[];
  routeGeometry?: RouteGeometry | null;
  className?: string;
  height?: string;
  zoom?: number;
  interactive?: boolean;
};

const DEFAULT_CENTER: [number, number] = [-70.6693, -33.4489];

export function MapView({
  markers = [],
  routeGeometry = null,
  className = '',
  height = '280px',
  zoom = 12,
  interactive = true,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const token = getMapboxPublicToken();
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom,
      interactive,
      attributionControl: true,
    });

    if (interactive) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    }

    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [interactive, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sync = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const bounds = new mapboxgl.LngLatBounds();
      let hasBounds = false;

      for (const marker of markers) {
        const el = document.createElement('div');
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.borderRadius = '9999px';
        el.style.background = marker.color ?? '#0F766E';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,.35)';
        if (marker.label) el.title = marker.label;

        const m = new mapboxgl.Marker({ element: el })
          .setLngLat([marker.longitude, marker.latitude])
          .addTo(map);
        markersRef.current.push(m);
        bounds.extend([marker.longitude, marker.latitude]);
        hasBounds = true;
      }

      const sourceId = 'pedidosgo-route';
      const layerId = 'pedidosgo-route-line';

      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      if (routeGeometry?.coordinates?.length) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: routeGeometry },
        });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#0F766E', 'line-width': 4, 'line-opacity': 0.85 },
        });
        for (const coord of routeGeometry.coordinates) {
          bounds.extend(coord as [number, number]);
          hasBounds = true;
        }
      }

      if (hasBounds) {
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 400 });
      } else if (markers.length === 1) {
        const only = markers[0];
        if (only) {
          map.easeTo({
            center: [only.longitude, only.latitude],
            zoom: 14,
            duration: 400,
          });
        }
      }
    };

    if (map.isStyleLoaded()) sync();
    else map.once('load', sync);
  }, [markers, routeGeometry]);

  const token = getMapboxPublicToken();
  if (!token) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 ${className}`}
        style={{ height }}
      >
        Configura NEXT_PUBLIC_MAPBOX_TOKEN (pk.) para ver el mapa
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}
      style={{ height }}
    />
  );
}
