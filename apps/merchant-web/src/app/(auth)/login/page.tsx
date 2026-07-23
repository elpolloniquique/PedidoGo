import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
        Acceso para dueños, administradores y operadores del comercio.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LoginForm showRegisterLink registerHref="/register" />
      </Suspense>
    </div>
  );
}
