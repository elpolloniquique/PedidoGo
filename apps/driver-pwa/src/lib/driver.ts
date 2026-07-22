import type { DriverApplicationStatus, VehicleType } from '@pedidosgo/types';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { requireAppUser } from './auth';
import type {
  DriverDocumentRecord,
  DriverRecord,
  DriverVehicleRecord,
} from './driver-constants';

export type {
  DriverDocumentRecord,
  DriverRecord,
  DriverVehicleRecord,
} from './driver-constants';

export {
  DOCUMENT_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
  STATUS_LABELS,
  canEditApplication,
} from './driver-constants';

export async function requireDriver(): Promise<{
  profile: Awaited<ReturnType<typeof requireAppUser>>;
  driver: DriverRecord;
}> {
  const profile = await requireAppUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('drivers')
    .select(
      'id, user_id, rut, birth_date, region, city, commune, address_line, emergency_contact_name, emergency_contact_phone, profile_image_url, status, approved_at',
    )
    .eq('user_id', profile.id)
    .maybeSingle();

  if (error || !data) {
    redirect('/login?error=no_driver');
  }

  return {
    profile,
    driver: {
      id: data.id,
      userId: data.user_id,
      rut: data.rut,
      birthDate: data.birth_date,
      region: data.region,
      city: data.city,
      commune: data.commune,
      addressLine: data.address_line,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      profileImageUrl: data.profile_image_url,
      status: data.status as DriverApplicationStatus,
      approvedAt: data.approved_at,
    },
  };
}

export async function getDriverDocuments(driverId: string): Promise<DriverDocumentRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('driver_documents')
    .select('id, document_type, storage_path, status, rejection_reason, created_at')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    documentType: row.document_type,
    storagePath: row.storage_path,
    status: row.status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
  }));
}

export async function getDriverVehicles(driverId: string): Promise<DriverVehicleRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('driver_vehicles')
    .select(
      'id, vehicle_type, brand, model, year, color, license_plate, capacity, is_primary',
    )
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    vehicleType: row.vehicle_type as VehicleType,
    brand: row.brand,
    model: row.model,
    year: row.year,
    color: row.color,
    licensePlate: row.license_plate,
    capacity: row.capacity,
    isPrimary: row.is_primary,
  }));
}
