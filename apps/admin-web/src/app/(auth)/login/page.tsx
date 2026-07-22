import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Panel Superadministrador</h2>
      <p className="text-sm text-slate-600">
        Solo cuentas con rol <code>super_admin</code> o <code>platform_admin</code>.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LoginForm showRegisterLink={false} />
      </Suspense>
    </div>
  );
}
