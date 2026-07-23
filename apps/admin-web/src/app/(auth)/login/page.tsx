import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
        Solo cuentas con rol{' '}
        <code className="rounded-md bg-teal-50 px-1.5 py-0.5 text-xs font-semibold text-teal-900">
          super_admin
        </code>{' '}
        o{' '}
        <code className="rounded-md bg-teal-50 px-1.5 py-0.5 text-xs font-semibold text-teal-900">
          platform_admin
        </code>
        .
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LoginForm showRegisterLink={false} />
      </Suspense>
    </div>
  );
}
