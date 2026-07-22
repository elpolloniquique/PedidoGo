import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Panel del Comercio</h2>
      <p className="text-sm text-slate-600">
        Acceso para dueños, administradores y operadores de comercio.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LoginForm showRegisterLink registerHref="/register" />
      </Suspense>
    </div>
  );
}
