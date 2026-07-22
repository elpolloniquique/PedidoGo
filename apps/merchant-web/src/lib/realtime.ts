'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type GpsHandler = (point: {
  lat: number;
  lng: number;
  recordedAt: string | null;
  driverId: string;
}) => void;

/**
 * Suscribe a cambios de pedido, delivery, ofertas y (opcional) GPS del driver.
 * Por defecto refresca el RSC con router.refresh().
 */
export function useOrderRealtime(options: {
  orderId: string;
  deliveryRequestId?: string | null;
  driverId?: string | null;
  onDriverLocation?: GpsHandler;
  refreshOnChange?: boolean;
}) {
  const router = useRouter();
  const onDriverLocationRef = useRef(options.onDriverLocation);
  onDriverLocationRef.current = options.onDriverLocation;

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (options.refreshOnChange !== false) {
        router.refresh();
      }
    };

    let channel: RealtimeChannel = supabase.channel(`merchant-order:${options.orderId}`);

    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${options.orderId}`,
      },
      () => refresh(),
    );

    if (options.deliveryRequestId) {
      channel = channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_requests',
            filter: `id=eq.${options.deliveryRequestId}`,
          },
          () => refresh(),
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_offers',
            filter: `delivery_request_id=eq.${options.deliveryRequestId}`,
          },
          () => refresh(),
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_assignments',
            filter: `delivery_request_id=eq.${options.deliveryRequestId}`,
          },
          () => refresh(),
        );
    }

    if (options.driverId) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_current_locations',
          filter: `driver_id=eq.${options.driverId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = (payload.new ?? {}) as Record<string, unknown>;
          const lat = row.lat != null ? Number(row.lat) : NaN;
          const lng = row.lng != null ? Number(row.lng) : NaN;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          onDriverLocationRef.current?.({
            lat,
            lng,
            recordedAt: (row.recorded_at as string | null) ?? null,
            driverId: String(row.driver_id ?? options.driverId),
          });
        },
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    options.orderId,
    options.deliveryRequestId,
    options.driverId,
    options.refreshOnChange,
    router,
  ]);
}

/** Lista de pedidos del comercio: refresca cuando cambian orders del merchant. */
export function useMerchantOrdersRealtime(merchantId: string | null | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (!merchantId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`merchant-orders:${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `merchant_id=eq.${merchantId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [merchantId, router]);
}
