import type { DriverApplicationStatus, VehicleType } from '@pedidosgo/types';

export type DriverRecord = {
  id: string;
  userId: string;
  rut: string | null;
  birthDate: string | null;
  region: string | null;
  city: string | null;
  commune: string | null;
  addressLine: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  profileImageUrl: string | null;
  status: DriverApplicationStatus;
  approvedAt: string | null;
};

export type DriverDocumentRecord = {
  id: string;
  documentType: string;
  storagePath: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
};

export type DriverVehicleRecord = {
  id: string;
  vehicleType: VehicleType;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  licensePlate: string | null;
  capacity: string | null;
  isPrimary: boolean;
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  id_front: 'Cédula frontal',
  id_back: 'Cédula posterior',
  license: 'Licencia de conducir',
  circulation_permit: 'Permiso de circulación',
  mandatory_insurance: 'Seguro obligatorio',
  technical_review: 'Revisión técnica',
  other: 'Otro documento',
};

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  motorcycle: 'Motocicleta',
  car: 'Auto',
  bicycle: 'Bicicleta',
  electric_bicycle: 'Bicicleta eléctrica',
  scooter: 'Scooter',
  walking: 'A pie',
  other: 'Otro',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  under_review: 'En revisión',
  changes_required: 'Correcciones requeridas',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  suspended: 'Suspendida',
  blocked: 'Bloqueada',
  expired: 'Expirada',
};

export function canEditApplication(status: DriverApplicationStatus): boolean {
  return status === 'draft' || status === 'changes_required' || status === 'rejected';
}
