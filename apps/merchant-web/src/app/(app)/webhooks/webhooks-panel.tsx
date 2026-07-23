'use client';

import { Alert, Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  createWebhookAction,
  deleteWebhookAction,
  dispatchWebhooksAction,
  setWebhookActiveAction,
  testWebhookAction,
} from './actions';

type WebhookRow = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secretHint: string;
  createdAt: string;
};

type EventRow = {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

export function WebhooksPanel({
  webhooks,
  events,
}: {
  webhooks: WebhookRow[];
  events: EventRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; message?: string; secret?: string }>) {
    setMessage(null);
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.message ?? 'Error');
        return;
      }
      if (res.secret) setNewSecret(res.secret);
      setMessage(res.message ?? 'Listo');
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}
      {newSecret ? (
        <Alert variant="info">
          Secreto del webhook (copiálo ahora): <code className="break-all">{newSecret}</code>
        </Alert>
      ) : null}

      <form
        className="space-y-3 rounded-2xl border border-teal-900/10 bg-white/80 p-5"
        action={(fd) => run(() => createWebhookAction(fd))}
      >
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Nuevo endpoint
        </h3>
        <Input
          label="URL HTTPS"
          name="url"
          type="url"
          placeholder="https://tu-servidor.com/webhooks/rapidex"
          required
        />
        <Button type="submit" disabled={pending}>
          Crear webhook
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => dispatchWebhooksAction())}
        >
          Despachar pendientes
        </Button>
      </div>

      <ul className="space-y-3">
        {webhooks.length === 0 ? (
          <li className="text-sm text-[var(--color-ink-muted)]">Aún no hay webhooks.</li>
        ) : (
          webhooks.map((w) => (
            <li
              key={w.id}
              className="rounded-2xl border border-teal-900/10 bg-white/90 p-4 shadow-sm"
            >
              <p className="break-all text-sm font-semibold text-[var(--color-ink)]">{w.url}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                Eventos: {w.events.join(', ') || '—'} · Secreto: {w.secretHint} ·{' '}
                {w.isActive ? 'Activo' : 'Pausado'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="md"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => run(() => setWebhookActiveAction(w.id, !w.isActive))}
                >
                  {w.isActive ? 'Pausar' : 'Activar'}
                </Button>
                <Button
                  type="button"
                  size="md"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => run(() => testWebhookAction(w.id))}
                >
                  Probar
                </Button>
                <Button
                  type="button"
                  size="md"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => run(() => deleteWebhookAction(w.id))}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="rounded-2xl border border-teal-900/10 bg-white/80 p-5">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Eventos recientes
        </h3>
        <ul className="mt-3 divide-y divide-slate-100">
          {events.length === 0 ? (
            <li className="py-2 text-sm text-[var(--color-ink-muted)]">Sin eventos.</li>
          ) : (
            events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <strong>{e.eventType}</strong>{' '}
                  <span className="text-[var(--color-ink-muted)]">· {e.status}</span>
                </span>
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {new Date(e.createdAt).toLocaleString('es-CL')}
                  {e.lastError ? ` · ${e.lastError}` : ''}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
