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
        <span className="text-[0.72rem] font-semibold tracking-[0.12em] text-[var(--color-ink-muted)] uppercase">
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        className={`min-h-[3.1rem] rounded-2xl border border-teal-900/12 bg-[#fbfcfc] px-4 text-[0.95rem] text-[var(--color-ink)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 hover:border-teal-800/20 focus:border-[var(--color-brand-600)] focus:bg-white focus:ring-4 focus:ring-teal-600/12 disabled:opacity-50 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
