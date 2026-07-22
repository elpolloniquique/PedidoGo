import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium text-slate-700">{label}</span> : null}
      <input
        id={inputId}
        className={`min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:opacity-50 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
