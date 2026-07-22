export type MerchantRecord = {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  isApproved: boolean;
};

export type BranchRecord = {
  id: string;
  merchantId: string;
  name: string;
  code: string | null;
  addressLine: string;
  city: string;
  commune: string;
  region: string | null;
  phone: string | null;
  isActive: boolean;
};

export type BranchSettingsRecord = {
  branchId: string;
  deliveryDispatchMode: 'automatic' | 'manual';
  autoSelectionStrategy: string;
  defaultSearchRadiusKm: number;
  offerTimeoutSeconds: number;
  allowDriverOffers: boolean;
  allowFixedFare: boolean;
};

export type BranchHourRecord = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

export type MerchantMemberRecord = {
  id: string;
  userId: string;
  role: string;
  branchId: string | null;
  isActive: boolean;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];
