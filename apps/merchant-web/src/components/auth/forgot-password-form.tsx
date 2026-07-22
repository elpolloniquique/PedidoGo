'use client';

import { forgotPasswordSchema } from '@pedidosgo/validation';
import { Alert, Button, Input } from '@pedidosgo/ui';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Correo inválido');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        { redirectTo },
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('No se pudo enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? (
        <Alert variant="success">
          Si el correo existe, recibirás un enlace para restablecer tu contraseña.
        </Alert>
      ) : null}

      <Input
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? 'Enviando…' : 'Enviar enlace'}
      </Button>

      <p className="text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-teal-700 hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </form>
  );
}
