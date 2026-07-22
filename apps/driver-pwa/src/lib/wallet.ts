import { createClient } from './supabase/server';
import { requireDriver } from './driver';

export type WalletSummary = {
  walletId: string;
  totalEarned: number;
  totalCommission: number;
  commissionPaid: number;
  commissionPending: number;
  currentDebt: number;
  updatedAt: string | null;
};

export type WalletTx = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number | null;
  description: string | null;
  createdAt: string;
};

export type CommissionRow = {
  id: string;
  deliveryAmount: number;
  commissionAmount: number;
  driverNetAmount: number;
  createdAt: string;
};

export async function getMyWallet(): Promise<WalletSummary | null> {
  await requireDriver();
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_my_wallet');
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    walletId: row.wallet_id,
    totalEarned: Number(row.total_earned),
    totalCommission: Number(row.total_commission),
    commissionPaid: Number(row.commission_paid),
    commissionPending: Number(row.commission_pending),
    currentDebt: Number(row.current_debt),
    updatedAt: row.updated_at ?? null,
  };
}

export async function listMyWalletTransactions(limit = 30): Promise<WalletTx[]> {
  const wallet = await getMyWallet();
  if (!wallet) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('wallet_transactions')
    .select('id, transaction_type, amount, balance_after, description, created_at')
    .eq('wallet_id', wallet.walletId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((t) => ({
    id: t.id,
    type: t.transaction_type,
    amount: Number(t.amount),
    balanceAfter: t.balance_after != null ? Number(t.balance_after) : null,
    description: t.description,
    createdAt: t.created_at,
  }));
}

export async function listMyCommissions(limit = 20): Promise<CommissionRow[]> {
  const { driver } = await requireDriver();
  const supabase = await createClient();
  const { data } = await supabase
    .from('commissions')
    .select('id, delivery_amount, commission_amount, driver_net_amount, created_at')
    .eq('driver_id', driver.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((c) => ({
    id: c.id,
    deliveryAmount: Number(c.delivery_amount),
    commissionAmount: Number(c.commission_amount),
    driverNetAmount: Number(c.driver_net_amount),
    createdAt: c.created_at,
  }));
}

export async function listMyPendingPayments() {
  const { driver } = await requireDriver();
  const supabase = await createClient();
  const { data } = await supabase
    .from('payments')
    .select('id, amount, status, notes, created_at, reviewed_at')
    .eq('driver_id', driver.id)
    .order('created_at', { ascending: false })
    .limit(20);
  return data ?? [];
}
