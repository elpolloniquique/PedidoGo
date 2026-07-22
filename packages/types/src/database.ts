/**
 * Tipos de tablas Supabase (Fase 2).
 * En fases posteriores se puede generar automáticamente con:
 * supabase gen types typescript --project-id TU_REF > packages/types/src/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppSettingRow = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
};

export type MerchantRow = {
  id: string;
  name: string;
  legal_name: string | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
};

export type BranchRow = {
  id: string;
  merchant_id: string;
  name: string;
  code: string | null;
  address_line: string;
  city: string;
  commune: string;
  is_active: boolean;
};

export type DriverRow = {
  id: string;
  user_id: string;
  status: string;
  average_rating: number;
  completed_deliveries: number;
};

export type OrderRow = {
  id: string;
  order_number: string;
  merchant_id: string;
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
};
