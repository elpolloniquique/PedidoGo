import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { requireAppUser } from './auth';
import type {
  BranchHourRecord,
  BranchRecord,
  BranchSettingsRecord,
  MerchantMemberRecord,
  MerchantRecord,
} from './merchant-constants';

export type {
  BranchHourRecord,
  BranchRecord,
  BranchSettingsRecord,
  MerchantMemberRecord,
  MerchantRecord,
} from './merchant-constants';

export { DAY_LABELS } from './merchant-constants';

export async function requireMerchantContext(): Promise<{
  profile: Awaited<ReturnType<typeof requireAppUser>>;
  merchant: MerchantRecord;
  membershipRole: string;
}> {
  const profile = await requireAppUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from('merchant_users')
    .select('id, merchant_id, role, is_active')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect('/onboarding');
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, name, legal_name, email, phone, website_url, is_active, is_approved')
    .eq('id', membership.merchant_id)
    .maybeSingle();

  if (!merchant) {
    redirect('/onboarding');
  }

  return {
    profile,
    membershipRole: membership.role,
    merchant: {
      id: merchant.id,
      name: merchant.name,
      legalName: merchant.legal_name,
      email: merchant.email,
      phone: merchant.phone,
      websiteUrl: merchant.website_url,
      isActive: merchant.is_active,
      isApproved: merchant.is_approved,
    },
  };
}

export async function listBranches(merchantId: string): Promise<BranchRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('branches')
    .select(
      'id, merchant_id, name, code, address_line, city, commune, region, phone, is_active',
    )
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: true });

  return (data ?? []).map((b) => ({
    id: b.id,
    merchantId: b.merchant_id,
    name: b.name,
    code: b.code,
    addressLine: b.address_line,
    city: b.city,
    commune: b.commune,
    region: b.region,
    phone: b.phone,
    isActive: b.is_active,
  }));
}

export async function getBranch(branchId: string): Promise<BranchRecord | null> {
  const supabase = await createClient();
  const { data: b } = await supabase
    .from('branches')
    .select(
      'id, merchant_id, name, code, address_line, city, commune, region, phone, is_active',
    )
    .eq('id', branchId)
    .maybeSingle();

  if (!b) return null;
  return {
    id: b.id,
    merchantId: b.merchant_id,
    name: b.name,
    code: b.code,
    addressLine: b.address_line,
    city: b.city,
    commune: b.commune,
    region: b.region,
    phone: b.phone,
    isActive: b.is_active,
  };
}

export async function getBranchSettings(branchId: string): Promise<BranchSettingsRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('branch_settings')
    .select(
      'branch_id, delivery_dispatch_mode, auto_selection_strategy, default_search_radius_km, offer_timeout_seconds, allow_driver_offers, allow_fixed_fare',
    )
    .eq('branch_id', branchId)
    .maybeSingle();

  if (!data) return null;
  return {
    branchId: data.branch_id,
    deliveryDispatchMode: data.delivery_dispatch_mode,
    autoSelectionStrategy: data.auto_selection_strategy,
    defaultSearchRadiusKm: Number(data.default_search_radius_km),
    offerTimeoutSeconds: data.offer_timeout_seconds,
    allowDriverOffers: data.allow_driver_offers,
    allowFixedFare: data.allow_fixed_fare,
  };
}

export async function getBranchHours(branchId: string): Promise<BranchHourRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('branch_hours')
    .select('day_of_week, opens_at, closes_at, is_closed')
    .eq('branch_id', branchId)
    .order('day_of_week', { ascending: true });

  const byDay = new Map(
    (data ?? []).map((h) => [
      h.day_of_week,
      {
        dayOfWeek: h.day_of_week,
        opensAt: String(h.opens_at).slice(0, 5),
        closesAt: String(h.closes_at).slice(0, 5),
        isClosed: h.is_closed,
      } satisfies BranchHourRecord,
    ]),
  );

  return Array.from({ length: 7 }, (_, day) => {
    return (
      byDay.get(day) ?? {
        dayOfWeek: day,
        opensAt: '10:00',
        closesAt: '22:00',
        isClosed: false,
      }
    );
  });
}

export async function listMerchantMembers(
  _merchantId?: string,
): Promise<MerchantMemberRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('list_my_merchant_members');

  return (data ?? []).map(
    (row: {
      id: string;
      user_id: string;
      role: string;
      branch_id: string | null;
      is_active: boolean;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
    }) => ({
      id: row.id,
      userId: row.user_id,
      role: row.role,
      branchId: row.branch_id,
      isActive: row.is_active,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
    }),
  );
}
