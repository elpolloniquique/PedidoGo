import { brandConfig } from '@pedidosgo/config';
import type { ReactNode } from 'react';

export type AppShellProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** auth = login centrado; panel = app autenticada; public = tracking */
  variant?: 'auth' | 'panel' | 'public';
  /** Contenido bajo el título (nav) */
  toolbar?: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  children,
  variant = 'panel',
  toolbar,
}: AppShellProps) {
  const isAuth = variant === 'auth';
  const isPublic = variant === 'public';

  return (
    <div className="rx-atmosphere">
      <main
        className={`mx-auto flex w-full flex-col px-5 py-8 sm:px-8 ${
          isAuth ? 'max-w-lg justify-center gap-8 py-12 sm:py-16' : 'max-w-5xl gap-7 py-10 sm:py-12'
        }`}
      >
        <header className={isAuth ? 'text-center' : 'space-y-4'}>
          <p
            className={`rx-brand-mark ${
              isAuth || isPublic ? 'text-4xl sm:text-5xl' : 'text-xl sm:text-2xl'
            }`}
          >
            {brandConfig.appShortName}
          </p>

          {isAuth ? (
            <div className="mt-3 space-y-2">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  {subtitle}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="max-w-2xl text-sm text-[var(--color-ink-muted)] sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>
          )}

          {toolbar ? (
            <nav className="flex flex-wrap items-center gap-1.5 border-y border-teal-900/8 py-3">
              {toolbar}
            </nav>
          ) : null}
        </header>

        {children}
      </main>
    </div>
  );
}
