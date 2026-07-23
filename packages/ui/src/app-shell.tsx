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

/**
 * Auth / public: una sola composición (marca + título + panel).
 * Panel: cabecera + toolbar + contenido.
 */
export function AppShell({
  title,
  subtitle,
  children,
  variant = 'panel',
  toolbar,
}: AppShellProps) {
  const isAuth = variant === 'auth';
  const isPublic = variant === 'public';
  const isEntry = isAuth || isPublic;

  if (isEntry) {
    return (
      <div className="rx-atmosphere rx-atmosphere--auth">
        <main className="rx-auth-stage">
          <section
            className={`rx-auth-card${isPublic ? ' rx-auth-card--wide' : ''}`}
            aria-label={title}
          >
            <header className="rx-auth-card__header">
              <p className="rx-brand-mark rx-brand-mark--hero">{brandConfig.appShortName}</p>
              <h1 className="rx-auth-card__title">{title}</h1>
              {subtitle ? <p className="rx-auth-card__subtitle">{subtitle}</p> : null}
            </header>
            <div className="rx-auth-card__body">{children}</div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="rx-atmosphere">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-5 py-10 sm:px-8 sm:py-12">
        <header className="space-y-4">
          <p className="rx-brand-mark text-xl sm:text-2xl">{brandConfig.appShortName}</p>
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
