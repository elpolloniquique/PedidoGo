'use client';

import { loginSchema } from '@pedidosgo/validation';
import { Alert, Button, Input } from '@pedidosgo/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

type LoginFormProps = {
  showRegisterLink?: boolean;
  registerHref?: string;
};

function isEmailNotConfirmed(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('email not confirmed') || m.includes('email_not_confirmed');
}

export function LoginForm({
  showRegisterLink = false,
  registerHref = '/register',
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get('error');
  const next = searchParams.get('next') || '/';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (signInError && isEmailNotConfirmed(signInError.message)) {
        await fetch('/api/auth/confirm-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: parsed.data.email }),
        });
        ({ error: signInError } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        }));
      }

      if (signInError) {
        setError(
          isEmailNotConfirmed(signInError.message)
            ? 'Tu correo aún no está confirmado. Probá de nuevo en unos segundos o contactá soporte.'
            : 'Correo o contraseña incorrectos',
        );
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError('No se pudo iniciar sesión. Revisa la configuración de Supabase.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {urlError === 'forbidden' ? (
        <Alert variant="error">
          Tu cuenta no tiene permiso para esta aplicación.
        </Alert>
      ) : null}
      {urlError === 'inactive' ? (
        <Alert variant="error">Tu cuenta está inactiva. Contacta a soporte.</Alert>
      ) : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Input
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div className="-mt-1 flex items-center justify-between text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-teal-800 underline-offset-2 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? 'Ingresando…' : 'Iniciar sesión'}
      </Button>

      {showRegisterLink ? (
        <p className="text-center text-sm text-[var(--color-ink-muted)]">
          ¿No tienes cuenta?{' '}
          <Link
            href={registerHref}
            className="font-semibold text-teal-800 underline-offset-2 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      ) : null}
    </form>
  );
}
