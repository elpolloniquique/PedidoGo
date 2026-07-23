import { createClient } from '@/lib/supabase/server';

export type MerchantDashboardMetrics = {
  ordersToday: number;
  ordersActive: number;
  ordersDeliveredToday: number;
  ordersCancelledToday: number;
  jobsSearching: number;
  webhooksPending: number;
  webhooksFailedToday: number;
  branchesActive: number;
};

export async function getMerchantDashboardMetrics(): Promise<MerchantDashboardMetrics | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_merchant_dashboard_metrics');
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    ordersToday: Number(row.orders_today ?? 0),
    ordersActive: Number(row.orders_active ?? 0),
    ordersDeliveredToday: Number(row.orders_delivered_today ?? 0),
    ordersCancelledToday: Number(row.orders_cancelled_today ?? 0),
    jobsSearching: Number(row.jobs_searching ?? 0),
    webhooksPending: Number(row.webhooks_pending ?? 0),
    webhooksFailedToday: Number(row.webhooks_failed_today ?? 0),
    branchesActive: Number(row.branches_active ?? 0),
  };
}
