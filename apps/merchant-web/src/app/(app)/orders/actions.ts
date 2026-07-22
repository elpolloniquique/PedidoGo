'use server';

import {
  createOrderSchema,
  orderStatusSchema,
} from '@pedidosgo/validation';
import { revalidatePath } from 'next/cache';
import { requireMerchantContext } from '@/lib/merchant';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; message: string };

function parseBool(value: FormDataEntryValue | null): boolean {
  return value === 'true' || value === 'on' || value === '1';
}

export async function createOrderAction(formData: FormData): Promise<ActionResult> {
  await requireMerchantContext();

  const rawItems = String(formData.get('itemsJson') || '[]');
  let items: unknown;
  try {
    items = JSON.parse(rawItems);
  } catch {
    return { ok: false, message: 'Ítems inválidos' };
  }

  const parsed = createOrderSchema.safeParse({
    branchId: formData.get('branchId'),
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    deliveryAddress: formData.get('deliveryAddress'),
    deliveryCommune: formData.get('deliveryCommune'),
    deliveryCity: formData.get('deliveryCity'),
    deliveryApartment: formData.get('deliveryApartment') || undefined,
    deliveryReferences: formData.get('deliveryReferences') || undefined,
    paymentMethod: formData.get('paymentMethod') || 'cash',
    amountToCollect: formData.get('amountToCollect') || 0,
    deliveryFee: formData.get('deliveryFee') || 0,
    fixedFare: formData.get('fixedFare') || undefined,
    notes: formData.get('notes') || undefined,
    publish: parseBool(formData.get('publish')),
    items,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_manual_order', {
    p_branch_id: parsed.data.branchId,
    p_customer_name: parsed.data.customerName,
    p_customer_phone: parsed.data.customerPhone,
    p_delivery_address: parsed.data.deliveryAddress,
    p_delivery_commune: parsed.data.deliveryCommune,
    p_delivery_city: parsed.data.deliveryCity,
    p_items: parsed.data.items.map((i) => ({
      product_name: i.productName,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      notes: i.notes ?? null,
    })),
    p_payment_method: parsed.data.paymentMethod,
    p_amount_to_collect: parsed.data.amountToCollect,
    p_notes: parsed.data.notes || null,
    p_delivery_fee: parsed.data.deliveryFee,
    p_delivery_apartment: parsed.data.deliveryApartment || null,
    p_delivery_references: parsed.data.deliveryReferences || null,
    p_publish: parsed.data.publish ?? false,
    p_fixed_fare: parsed.data.fixedFare ?? null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const orderId = data as string;
  const lat = Number(formData.get('deliveryLat'));
  const lng = Number(formData.get('deliveryLng'));
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    await supabase.rpc('set_order_delivery_location', {
      p_order_id: orderId,
      p_lat: lat,
      p_lng: lng,
    });
  }

  revalidatePath('/orders');
  revalidatePath('/');
  return { ok: true, message: 'Pedido creado.', id: orderId };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  comment?: string,
): Promise<ActionResult> {
  await requireMerchantContext();
  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, message: 'Estado no válido' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: parsed.data,
    p_comment: comment || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  return { ok: true, message: 'Estado actualizado.' };
}

export async function publishDeliveryAction(
  orderId: string,
  fixedFare?: number,
): Promise<ActionResult> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc('publish_delivery_request', {
    p_order_id: orderId,
    p_fixed_fare: fixedFare ?? null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
  return { ok: true, message: 'Pedido publicado a repartidores.' };
}

export async function acceptOfferAction(offerId: string, orderId: string): Promise<ActionResult> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc('accept_delivery_offer', {
    p_offer_id: offerId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/orders/${orderId}`);
  return { ok: true, message: 'Oferta aceptada. Repartidor asignado.' };
}

export async function submitDriverRatingAction(
  orderId: string,
  score: number,
  comment?: string,
): Promise<ActionResult> {
  await requireMerchantContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_driver_rating', {
    p_order_id: orderId,
    p_score: score,
    p_comment: comment?.trim() ? comment.trim() : null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/orders/${orderId}`);
  return { ok: true, message: 'Calificación enviada.' };
}
