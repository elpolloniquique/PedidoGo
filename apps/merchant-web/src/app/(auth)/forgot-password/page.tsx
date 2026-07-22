import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Recuperar contraseña</h2>
      <p className="text-sm text-slate-600">
        Te enviaremos un enlace a tu correo para crear una nueva contraseña.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
