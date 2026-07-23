import { createClient } from '@/lib/supabase/server';

export type AdminDashboardMetrics = {
  driversAvailable: number;
  driversBusy: number;
  driversOffline: number;
  driversPending: number;
  ordersActive: number;
  ordersDeliveredToday: number;
  ordersCancelledToday: number;
  jobsSearching: number;
  commissionPending: number;
  commissionPendingAmount: number;
  openSupportTickets: number;
  webhooksPending: number;
  merchantsActive: number;
  avgDriverRating: number;
};

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_admin_dashboard_metrics');
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    driversAvailable: Number(row.drivers_available ?? 0),
    driversBusy: Number(row.drivers_busy ?? 0),
    driversOffline: Number(row.drivers_offline ?? 0),
    driversPending: Number(row.drivers_pending ?? 0),
    ordersActive: Number(row.orders_active ?? 0),
    ordersDeliveredToday: Number(row.orders_delivered_today ?? 0),
    ordersCancelledToday: Number(row.orders_cancelled_today ?? 0),
    jobsSearching: Number(row.jobs_searching ?? 0),
    commissionPending: Number(row.commission_pending ?? 0),
    commissionPendingAmount: Number(row.commission_pending_amount ?? 0),
    openSupportTickets: Number(row.open_support_tickets ?? 0),
    webhooksPending: Number(row.webhooks_pending ?? 0),
    merchantsActive: Number(row.merchants_active ?? 0),
    avgDriverRating: Number(row.avg_driver_rating ?? 0),
  };
}
