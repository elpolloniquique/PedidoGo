'use client';

import { Alert, Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toggleFeatureFlagAction, updateSettingAction } from './actions';

export function FeatureFlagsPanel({
  flags,
}: {
  flags: Array<{ key: string; enabled: boolean; description: string | null }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {err ? <Alert variant="error">{err}</Alert> : null}
      {msg ? <Alert variant="success">{msg}</Alert> : null}
      <ul className="divide-y divide-slate-100 rounded-2xl border border-teal-900/10 bg-white/90">
        {flags.map((f) => (
          <li key={f.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-semibold text-[var(--color-ink)]">{f.key}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">{f.description || '—'}</p>
            </div>
            <Button
              type="button"
              variant={f.enabled ? 'primary' : 'secondary'}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setErr(null);
                  const res = await toggleFeatureFlagAction(f.key, !f.enabled);
                  if (!res.ok) setErr(res.message);
                  else {
                    setMsg(res.message ?? 'OK');
                    router.refresh();
                  }
                })
              }
            >
              {f.enabled ? 'ON' : 'OFF'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SettingsPanel({
  settings,
}: {
  settings: Array<{ key: string; value: string; description: string | null; isPublic: boolean }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {err ? <Alert variant="error">{err}</Alert> : null}
      {msg ? <Alert variant="success">{msg}</Alert> : null}
      {settings.map((s) => (
        <form
          key={s.key}
          className="space-y-2 rounded-2xl border border-teal-900/10 bg-white/90 p-4"
          action={(fd) => {
            start(async () => {
              setErr(null);
              const res = await updateSettingAction(fd);
              if (!res.ok) setErr(res.message);
              else {
                setMsg(res.message ?? 'OK');
                router.refresh();
              }
            });
          }}
        >
          <input type="hidden" name="key" value={s.key} />
          <p className="text-sm font-semibold">
            {s.key}{' '}
            {s.isPublic ? (
              <span className="text-xs font-normal text-teal-800">(público)</span>
            ) : null}
          </p>
          {s.description ? (
            <p className="text-xs text-[var(--color-ink-muted)]">{s.description}</p>
          ) : null}
          <Input name="value" defaultValue={s.value} />
          <Button type="submit" size="md" disabled={pending}>
            Guardar
          </Button>
        </form>
      ))}
    </div>
  );
}
