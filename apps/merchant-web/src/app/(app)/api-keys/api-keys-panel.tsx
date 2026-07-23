'use client';

import { Alert, Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createApiKeyAction, revokeApiKeyAction } from './actions';

type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

export function ApiKeysPanel({ keys }: { keys: KeyRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [plainKey, setPlainKey] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {info ? <Alert variant="success">{info}</Alert> : null}
      {plainKey ? (
        <Alert variant="info">
          API key (copiá ahora): <code className="break-all">{plainKey}</code>
        </Alert>
      ) : null}

      <form
        className="space-y-3 rounded-2xl border border-teal-900/10 bg-white/90 p-5"
        action={(fd) => {
          setError(null);
          start(async () => {
            const res = await createApiKeyAction(fd);
            if (!res.ok) setError(res.message);
            else {
              setInfo(res.message ?? 'OK');
              if (res.apiKey) setPlainKey(res.apiKey);
              router.refresh();
            }
          });
        }}
      >
        <Input label="Nombre" name="name" defaultValue="Integración" required />
        <Button type="submit" disabled={pending}>
          Generar API key
        </Button>
      </form>

      <ul className="space-y-3">
        {keys.length === 0 ? (
          <li className="text-sm text-[var(--color-ink-muted)]">Sin API keys.</li>
        ) : (
          keys.map((k) => (
            <li
              key={k.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-900/10 bg-white/90 p-4 text-sm"
            >
              <div>
                <p className="font-semibold">{k.name}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {k.prefix}… · {k.isActive ? 'Activa' : 'Revocada'}
                  {k.lastUsedAt
                    ? ` · último uso ${new Date(k.lastUsedAt).toLocaleString('es-CL')}`
                    : ''}
                </p>
              </div>
              {k.isActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await revokeApiKeyAction(k.id);
                      if (!res.ok) setError(res.message);
                      else {
                        setInfo(res.message ?? 'OK');
                        router.refresh();
                      }
                    })
                  }
                >
                  Revocar
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
