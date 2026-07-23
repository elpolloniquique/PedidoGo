import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

/** Pantalla de acceso — tarjeta única RapideX + formulario. */
export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-ink-muted)]">Cargando…</p>}>
      <LoginForm showRegisterLink registerHref="/register" />
    </Suspense>
  );
}
