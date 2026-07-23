import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
};

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--color-brand-600,#0F766E)] text-white shadow-[0_12px_28px_rgba(15,118,110,0.3)] hover:bg-[var(--color-brand-800,#115e59)] hover:shadow-[0_14px_32px_rgba(15,118,110,0.36)] active:translate-y-px',
  secondary:
    'bg-white text-[var(--color-brand-900,#134e4a)] ring-1 ring-teal-900/10 hover:bg-teal-50',
  ghost: 'bg-transparent text-[var(--color-ink-muted,#475569)] hover:bg-teal-900/5 hover:text-[var(--color-brand-900,#134e4a)]',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-[3.15rem] px-6 text-[0.95rem]',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-2xl font-semibold tracking-tight transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-600,#0F766E)] disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
