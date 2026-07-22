'use server';

import { driverPersonalSchema, driverVehicleSchema } from '@pedidosgo/validation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { canEditApplication, requireDriver } from '@/lib/driver';

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export async function saveDriverPersonalAction(formData: FormData): Promise<ActionResult> {
  const { driver } = await requireDriver();
  if (!canEditApplication(driver.status)) {
    return { ok: false, message: 'No puedes editar datos en el estado actual.' };
  }

  const parsed = driverPersonalSchema.safeParse({
    rut: formData.get('rut'),
    birthDate: formData.get('birthDate'),
    region: formData.get('region'),
    city: formData.get('city'),
    commune: formData.get('commune'),
    addressLine: formData.get('addressLine'),
    emergencyContactName: formData.get('emergencyContactName'),
    emergencyContactPhone: formData.get('emergencyContactPhone'),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('drivers')
    .update({
      rut: parsed.data.rut,
      birth_date: parsed.data.birthDate,
      region: parsed.data.region,
      city: parsed.data.city,
      commune: parsed.data.commune,
      address_line: parsed.data.addressLine,
      emergency_contact_name: parsed.data.emergencyContactName,
      emergency_contact_phone: parsed.data.emergencyContactPhone,
      status: driver.status === 'rejected' ? 'draft' : driver.status,
    })
    .eq('id', driver.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/onboarding');
  revalidatePath('/');
  return { ok: true, message: 'Datos personales guardados.' };
}

export async function saveDriverVehicleAction(formData: FormData): Promise<ActionResult> {
  const { driver } = await requireDriver();
  if (!canEditApplication(driver.status)) {
    return { ok: false, message: 'No puedes editar el vehículo en el estado actual.' };
  }

  const parsed = driverVehicleSchema.safeParse({
    vehicleType: formData.get('vehicleType'),
    brand: formData.get('brand'),
    model: formData.get('model'),
    year: formData.get('year'),
    color: formData.get('color'),
    licensePlate: formData.get('licensePlate'),
    capacity: formData.get('capacity') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();

  // Un vehículo primario: desactivar anteriores e insertar/actualizar
  await supabase
    .from('driver_vehicles')
    .update({ is_primary: false })
    .eq('driver_id', driver.id);

  const { error } = await supabase.from('driver_vehicles').insert({
    driver_id: driver.id,
    vehicle_type: parsed.data.vehicleType,
    brand: parsed.data.brand,
    model: parsed.data.model,
    year: parsed.data.year,
    color: parsed.data.color,
    license_plate: parsed.data.licensePlate,
    capacity: parsed.data.capacity || null,
    is_primary: true,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/vehicle');
  revalidatePath('/');
  return { ok: true, message: 'Vehículo registrado.' };
}

export async function uploadDriverDocumentAction(formData: FormData): Promise<ActionResult> {
  const { profile, driver } = await requireDriver();
  if (!canEditApplication(driver.status)) {
    return { ok: false, message: 'No puedes subir documentos en el estado actual.' };
  }

  const documentType = String(formData.get('documentType') || '');
  const file = formData.get('file');

  if (!documentType) {
    return { ok: false, message: 'Selecciona el tipo de documento.' };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Selecciona un archivo.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, message: 'El archivo no puede superar 10 MB.' };
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    return { ok: false, message: 'Formato no permitido. Usa JPG, PNG, WEBP o PDF.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${profile.id}/${documentType}_${Date.now()}.${ext}`;

  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('driver-documents')
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { error: insertError } = await supabase.from('driver_documents').insert({
    driver_id: driver.id,
    document_type: documentType,
    storage_path: path,
    status: 'pending',
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  revalidatePath('/documents');
  revalidatePath('/');
  return { ok: true, message: 'Documento subido correctamente.' };
}

export async function submitApplicationAction(): Promise<ActionResult> {
  await requireDriver();
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_driver_application');

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/application');
  revalidatePath('/');
  return { ok: true, message: 'Solicitud enviada. Te avisaremos cuando sea revisada.' };
}
