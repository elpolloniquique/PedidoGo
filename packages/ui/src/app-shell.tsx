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
 * Panel: cabecera + nav + contenido con márgenes generosos.
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
      <div className="rx-panel-shell">
        <header className="rx-panel-header">
          <div className="rx-panel-header__brand">
            <p className="rx-brand-mark rx-brand-mark--panel">{brandConfig.appShortName}</p>
            <div className="rx-panel-header__meta">
              <h1 className="rx-panel-header__title">{title}</h1>
              {subtitle ? <p className="rx-panel-header__subtitle">{subtitle}</p> : null}
            </div>
          </div>
          {toolbar ? <nav className="rx-panel-nav">{toolbar}</nav> : null}
        </header>
        <main className="rx-panel-main">{children}</main>
      </div>
    </div>
  );
}
