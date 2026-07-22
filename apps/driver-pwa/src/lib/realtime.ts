'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/** Marketplace: nuevas solicitudes / cambios de estado abiertos. */
export function useOpenJobsRealtime(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const channel = supabase
      .channel('driver-open-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_requests',
        },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_offers',
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, router]);
}

/** Entrega activa: cambios de request / assignment. */
export function useActiveDeliveryRealtime(deliveryRequestId: string | null | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (!deliveryRequestId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`driver-delivery:${deliveryRequestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_requests',
          filter: `id=eq.${deliveryRequestId}`,
        },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `delivery_request_id=eq.${deliveryRequestId}`,
        },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_offers',
          filter: `delivery_request_id=eq.${deliveryRequestId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [deliveryRequestId, router]);
}
