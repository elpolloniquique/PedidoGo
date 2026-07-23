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
};

export function HomeActionGrid({ actions }: { actions: HomeAction[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <a
          key={action.href}
          href={action.href}
          className="group rounded-2xl border border-teal-900/10 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-teal-700/25 hover:bg-white hover:shadow-[0_16px_40px_rgba(11,18,32,0.08)]"
        >
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--color-ink)]">
            {action.title}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {action.description}
          </p>
          <span className="mt-4 inline-flex text-sm font-semibold text-[var(--color-brand-700)] group-hover:underline">
            Abrir →
          </span>
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
  return <div className={`rx-panel p-6 sm:p-8 ${className}`}>{children}</div>;
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
