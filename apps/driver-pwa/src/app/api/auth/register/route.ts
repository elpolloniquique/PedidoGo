import { NextResponse } from 'next/server';
import { registerSchema } from '@pedidosgo/validation';
import {
  confirmAuthUserEmail,
  createServiceRoleClient,
  findAuthUserByEmail,
} from '@/lib/supabase/auth-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    if (parsed.data.intendedRole !== 'driver') {
      return NextResponse.json({ ok: false, error: 'Rol no permitido' }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const meta = {
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone || null,
      intended_role: parsed.data.intendedRole,
    };

    const { error: createError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: meta,
    });

    if (createError) {
      const msg = createError.message.toLowerCase();
      const exists =
        msg.includes('already') || msg.includes('registered') || msg.includes('exists');

      if (!exists) {
        return NextResponse.json({ ok: false, error: createError.message }, { status: 400 });
      }

      const existing = await findAuthUserByEmail(admin, parsed.data.email);
      if (!existing) {
        return NextResponse.json(
          { ok: false, error: 'El correo ya está registrado. Iniciá sesión.' },
          { status: 409 },
        );
      }

      const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: meta,
      });
      if (updateError) {
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        recovered: true,
        message: 'Cuenta activada. Iniciando sesión…',
      });
    }

    return NextResponse.json({ ok: true, message: 'Cuenta creada.' });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'No se pudo registrar. Revisá SUPABASE_SERVICE_ROLE_KEY.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
