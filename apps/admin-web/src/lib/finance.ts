import { createClient } from './supabase/server';
import { requireAppUser } from './auth';

export async function listRecentCommissions(limit = 50) {
  await requireAppUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from('commissions')
    .select(
      'id, driver_id, delivery_amount, commission_amount, driver_net_amount, created_at, delivery_request_id',
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listWalletsWithDebt() {
  await requireAppUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from('driver_wallets')
    .select(
      'id, driver_id, total_earned, total_commission, commission_paid, commission_pending, current_debt, updated_at',
    )
    .gt('current_debt', 0)
    .order('current_debt', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function listPendingPayments() {
  await requireAppUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from('payments')
    .select('id, driver_id, amount, status, notes, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function getActiveCommissionRule() {
  await requireAppUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from('commission_rules')
    .select(
      'id, name, percentage, minimum_commission, maximum_commission, grace_debt_limit, suspension_debt_limit, is_active',
    )
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
