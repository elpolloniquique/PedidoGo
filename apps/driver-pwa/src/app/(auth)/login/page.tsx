import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">App del Repartidor</h2>
      <p className="text-sm text-slate-600">
        Inicia sesión para recibir pedidos y compartir tu ubicación.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LoginForm showRegisterLink registerHref="/register" />
      </Suspense>
    </div>
  );
}
