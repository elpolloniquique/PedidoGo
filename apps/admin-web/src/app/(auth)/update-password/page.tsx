import { UpdatePasswordForm } from '@/components/auth/update-password-form';

export default function UpdatePasswordPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Nueva contraseña</h2>
      <p className="text-sm text-slate-600">Elige una contraseña segura de al menos 8 caracteres.</p>
      <UpdatePasswordForm />
    </div>
  );
}
