'use client';

import { createClient } from '@/lib/supabase/client';

export type GpsPosition = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
};

export type GpsWatcherOptions = {
  orderId?: string | null;
  /** ms entre envíos a Supabase (default 8s) */
  uploadIntervalMs?: number;
  /** escribir historial cada N uploads (default 3) */
  historyEveryN?: number;
  onPosition?: (pos: GpsPosition) => void;
  onError?: (message: string) => void;
  onUploaded?: () => void;
};

/**
 * Inicia watchPosition del navegador y sube a upsert_my_location.
 * Retorna función stop().
 */
export function startGpsWatcher(options: GpsWatcherOptions = {}): () => void {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    options.onError?.('Este dispositivo no soporta geolocalización');
    return () => undefined;
  }

  const uploadIntervalMs = options.uploadIntervalMs ?? 8000;
  const historyEveryN = options.historyEveryN ?? 3;
  let lastUpload = 0;
  let uploadCount = 0;
  let latest: GpsPosition | null = null;
  let stopped = false;

  const supabase = createClient();

  async function upload(writeHistory: boolean) {
    if (!latest || stopped) return;
    try {
      const { error } = await supabase.rpc('upsert_my_location', {
        p_lng: latest.longitude,
        p_lat: latest.latitude,
        p_accuracy_meters: latest.accuracy,
        p_speed_mps: latest.speed,
        p_heading_degrees: latest.heading,
        p_order_id: options.orderId ?? null,
        p_write_history: writeHistory,
      });
      if (error) {
        options.onError?.(error.message);
        return;
      }
      options.onUploaded?.();
    } catch (err) {
      options.onError?.(err instanceof Error ? err.message : 'Error GPS');
    }
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      latest = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        speed: pos.coords.speed ?? null,
        heading: pos.coords.heading ?? null,
        timestamp: pos.timestamp,
      };
      options.onPosition?.(latest);

      const now = Date.now();
      if (now - lastUpload >= uploadIntervalMs) {
        lastUpload = now;
        uploadCount += 1;
        void upload(uploadCount % historyEveryN === 0);
      }
    },
    (err) => {
      const msg =
        err.code === err.PERMISSION_DENIED
          ? 'Permiso de ubicación denegado'
          : err.code === err.POSITION_UNAVAILABLE
            ? 'Ubicación no disponible'
            : 'Timeout de GPS';
      options.onError?.(msg);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
    },
  );

  // primer fix inmediato
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      latest = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        speed: pos.coords.speed ?? null,
        heading: pos.coords.heading ?? null,
        timestamp: pos.timestamp,
      };
      options.onPosition?.(latest);
      lastUpload = Date.now();
      uploadCount = 1;
      void upload(true);
    },
    () => undefined,
    { enableHighAccuracy: true, timeout: 15000 },
  );

  return () => {
    stopped = true;
    navigator.geolocation.clearWatch(watchId);
  };
}
