import type { ReactNode } from 'react';
import { Button } from './button';

export type NavItem = {
  href: string;
  label: string;
};

export type PanelNavProps = {
  items: NavItem[];
  trailing?: ReactNode;
};

/** Navegación compacta para paneles autenticados */
export function PanelNav({ items, trailing }: PanelNavProps) {
  return (
    <>
      {items.map((item) => (
        <a key={item.href} href={item.href} className="rx-nav-link">
          {item.label}
        </a>
      ))}
      {trailing}
    </>
  );
}

export type HomeAction = {
  href: string;
  title: string;
  description: string;
  /** Inicial opcional para el badge del card */
  initial?: string;
};

export function HomeActionGrid({ actions }: { actions: HomeAction[] }) {
  return (
    <div className="rx-action-grid">
      {actions.map((action) => (
        <a key={action.href} href={action.href} className="rx-action-card">
          <span className="rx-action-card__kicker" aria-hidden>
            {(action.initial ?? action.title).slice(0, 1).toUpperCase()}
          </span>
          <p className="rx-action-card__title">{action.title}</p>
          <p className="rx-action-card__desc">{action.description}</p>
          <span className="rx-action-card__cta">Abrir →</span>
        </a>
      ))}
    </div>
  );
}

export function Surface({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`rx-panel ${className}`.trim()}>{children}</div>;
}

export function AuthPrimaryButton(props: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <Button
      type={props.type ?? 'submit'}
      size="lg"
      className="w-full"
      disabled={props.disabled || props.loading}
    >
      {props.children}
    </Button>
  );
}
