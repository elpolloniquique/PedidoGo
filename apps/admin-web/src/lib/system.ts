import { createClient } from '@/lib/supabase/server';

export type PlatformHealth = {
  pendingDriverApplications: number;
  pendingCommissionPayments: number;
  activeDeliveries: number;
  openDeliveryJobs: number;
  publicTrackingEnabled: boolean;
  notificationsRealtime: boolean;
  rateLimitBuckets: number;
};

export async function getPlatformHealth(): Promise<PlatformHealth | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_platform_health');
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    pendingDriverApplications: Number(row.pending_driver_applications ?? 0),
    pendingCommissionPayments: Number(row.pending_commission_payments ?? 0),
    activeDeliveries: Number(row.active_deliveries ?? 0),
    openDeliveryJobs: Number(row.open_delivery_jobs ?? 0),
    publicTrackingEnabled: Boolean(row.public_tracking_enabled),
    notificationsRealtime: Boolean(row.notifications_realtime),
    rateLimitBuckets: Number(row.rate_limit_buckets ?? 0),
  };
}
