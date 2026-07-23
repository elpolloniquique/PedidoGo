'use client';

import { Alert, Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { addMessageAction, createTicketAction, setTicketStatusAction } from './actions';

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

export function CreateTicketForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      action={(fd) => {
        setError(null);
        start(async () => {
          const res = await createTicketAction(fd);
          if (res && 'ok' in res && !res.ok) setError(res.message);
        });
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Input label="Asunto" name="subject" required minLength={3} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[0.72rem] font-semibold tracking-[0.12em] text-[var(--color-ink-muted)] uppercase">
          Mensaje
        </span>
        <textarea
          name="message"
          required
          minLength={3}
          rows={4}
          className="rounded-2xl border border-teal-900/12 bg-[#fbfcfc] px-4 py-3 text-[0.95rem] outline-none focus:border-[var(--color-brand-600)] focus:ring-4 focus:ring-teal-600/12"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[0.72rem] font-semibold tracking-[0.12em] text-[var(--color-ink-muted)] uppercase">
          Prioridad
        </span>
        <select
          name="priority"
          defaultValue="normal"
          className="min-h-12 rounded-2xl border border-teal-900/12 bg-white px-3"
        >
          <option value="low">Baja</option>
          <option value="normal">Normal</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
      </label>
      <Button type="submit" disabled={pending}>
        Crear ticket
      </Button>
    </form>
  );
}

export function TicketThread({
  ticketId,
  status,
  canModerate,
  messages,
}: {
  ticketId: string;
  status: string;
  canModerate: boolean;
  messages: Array<{
    id: string;
    authorEmail: string | null;
    message: string;
    createdAt: string;
  }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {info ? <Alert variant="success">{info}</Alert> : null}

      <p className="text-sm text-[var(--color-ink-muted)]">
        Estado: <strong>{STATUS_LABEL[status] ?? status}</strong>
      </p>

      {canModerate ? (
        <div className="flex flex-wrap gap-2">
          {(['in_progress', 'resolved', 'closed'] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await setTicketStatusAction(ticketId, s);
                  if (!res.ok) setError(res.message);
                  else {
                    setInfo(res.message ?? 'OK');
                    router.refresh();
                  }
                })
              }
            >
              Marcar {STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      ) : status !== 'closed' ? (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await setTicketStatusAction(ticketId, 'closed');
              if (!res.ok) setError(res.message);
              else {
                setInfo(res.message ?? 'OK');
                router.refresh();
              }
            })
          }
        >
          Cerrar ticket
        </Button>
      ) : null}

      <ul className="space-y-3">
        {messages.map((m) => (
          <li key={m.id} className="rounded-2xl border border-teal-900/10 bg-white/90 p-4">
            <p className="text-xs text-[var(--color-ink-muted)]">
              {m.authorEmail ?? 'Usuario'} · {new Date(m.createdAt).toLocaleString('es-CL')}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-ink)]">{m.message}</p>
          </li>
        ))}
      </ul>

      {status !== 'closed' ? (
        <form
          className="space-y-3"
          action={(fd) => {
            setError(null);
            start(async () => {
              const res = await addMessageAction(ticketId, fd);
              if (!res.ok) setError(res.message);
              else {
                setInfo(res.message ?? 'OK');
                router.refresh();
              }
            });
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[0.72rem] font-semibold tracking-[0.12em] text-[var(--color-ink-muted)] uppercase">
              Responder
            </span>
            <textarea
              name="message"
              required
              rows={3}
              className="rounded-2xl border border-teal-900/12 bg-[#fbfcfc] px-4 py-3 text-[0.95rem] outline-none focus:border-[var(--color-brand-600)] focus:ring-4 focus:ring-teal-600/12"
            />
          </label>
          <Button type="submit" disabled={pending}>
            Enviar
          </Button>
        </form>
      ) : null}
    </div>
  );
}
