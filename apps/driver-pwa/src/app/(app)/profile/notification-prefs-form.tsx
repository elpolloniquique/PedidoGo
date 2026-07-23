'use client';

import { Alert, Button } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveNotificationPrefsAction } from './notification-actions';

export type NotificationPrefs = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

export function NotificationPrefsForm({ prefs }: { prefs: NotificationPrefs }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className="space-y-3 rounded-2xl border border-teal-900/10 bg-white/90 p-5"
      action={(fd) => {
        setError(null);
        setOk(false);
        start(async () => {
          const res = await saveNotificationPrefsAction(fd);
          if (!res.ok) setError(res.message);
          else {
            setOk(true);
            router.refresh();
          }
        });
      }}
    >
      <h3 className="font-semibold text-[var(--color-ink)]">Preferencias de notificación</h3>
      {error ? <Alert variant="error">{error}</Alert> : null}
      {ok ? <Alert variant="success">Preferencias guardadas.</Alert> : null}
      {(
        [
          ['email_enabled', 'Correo', prefs.emailEnabled],
          ['in_app_enabled', 'En la app', prefs.inAppEnabled],
          ['sound_enabled', 'Sonido', prefs.soundEnabled],
          ['vibration_enabled', 'Vibración', prefs.vibrationEnabled],
        ] as const
      ).map(([name, label, checked]) => (
        <label key={name} className="flex items-center gap-3 text-sm text-[var(--color-ink)]">
          <input
            type="checkbox"
            name={name}
            defaultChecked={checked}
            className="size-4 rounded border-teal-300"
          />
          {label}
        </label>
      ))}
      <Button type="submit" disabled={pending}>
        Guardar preferencias
      </Button>
    </form>
  );
}
