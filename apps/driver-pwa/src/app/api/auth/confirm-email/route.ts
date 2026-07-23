import { NextResponse } from 'next/server';
import { emailSchema } from '@pedidosgo/validation';
import { confirmAuthUserEmail, createServiceRoleClient } from '@/lib/supabase/auth-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Confirma el correo de una cuenta pendiente (para poder iniciar sesión). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const parsed = emailSchema.safeParse(body.email);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Correo inválido' }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const ok = await confirmAuthUserEmail(admin, parsed.data);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al confirmar correo';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
