import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
};

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--color-brand-600,#0F766E)] text-white hover:bg-[var(--color-brand-800,#115e59)]',
  secondary:
    'bg-[var(--color-brand-100,#ccfbf1)] text-[var(--color-brand-900,#134e4a)] hover:bg-[var(--color-brand-200,#99f6e4)]',
  ghost: 'bg-transparent text-[var(--color-brand-900,#134e4a)] hover:bg-black/5',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-14 px-6 text-base',
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
      className={`inline-flex items-center justify-center rounded-xl font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-600,#0F766E)] disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
