import type { ReactNode } from 'react';

export type AlertProps = {
  children: ReactNode;
  variant?: 'info' | 'success' | 'error';
};

const styles: Record<NonNullable<AlertProps['variant']>, string> = {
  info: 'border-teal-200 bg-teal-50 text-teal-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-800',
};

export function Alert({ children, variant = 'info' }: AlertProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[variant]}`} role="status">
      {children}
    </div>
  );
}
