import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <span className="text-[0.8rem] font-semibold tracking-wide text-[var(--color-ink-muted)] uppercase">
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        className={`min-h-12 rounded-xl border border-slate-200/90 bg-white px-3.5 text-[var(--color-ink)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition placeholder:text-slate-400 focus:border-[var(--color-brand-600)] focus:ring-4 focus:ring-teal-600/15 disabled:opacity-50 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
