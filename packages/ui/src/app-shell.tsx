import { brandConfig } from '@pedidosgo/config';
import type { ReactNode } from 'react';

export type AppShellProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-teal-50 to-slate-100 text-slate-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-teal-700 uppercase">
            {brandConfig.appShortName}
          </p>
          <h1 className="font-[family-name:var(--font-display,Outfit,sans-serif)] text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {subtitle ? <p className="max-w-xl text-base text-slate-600">{subtitle}</p> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
