import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
        Entrá para recibir pedidos y compartir tu ubicación en tiempo real.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LoginForm showRegisterLink registerHref="/register" />
      </Suspense>
    </div>
  );
}
