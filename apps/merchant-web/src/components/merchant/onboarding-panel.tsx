'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import {
  bootstrapMerchantAction,
  linkDemoMerchantAction,
} from '@/app/(app)/actions';

export function OnboardingPanel() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'new' | 'demo' | null>(null);

  async function onBootstrap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading('new');
    setMessage(null);
    setError(null);
    const result = await bootstrapMerchantAction(new FormData(event.currentTarget));
    setLoading(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Listo');
    router.push('/');
    router.refresh();
  }

  async function onLinkDemo() {
    setLoading('demo');
    setMessage(null);
    setError(null);
    const result = await linkDemoMerchantAction();
    setLoading(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Listo');
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <form onSubmit={onBootstrap} className="space-y-4 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Crear comercio nuevo</h3>
        <p className="text-sm text-slate-600">
          Genera tu comercio, una sucursal principal, horarios y modo de despacho manual.
        </p>
        <Input label="Nombre del comercio" name="name" defaultValue="Mi comercio" required />
        <Button type="submit" size="lg" disabled={loading !== null}>
          {loading === 'new' ? 'Creando…' : 'Crear comercio'}
        </Button>
      </form>

      <div className="space-y-3 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 p-4">
        <h3 className="font-semibold text-slate-900">Vincular demo El Pollón</h3>
        <p className="text-sm text-slate-600">
          Si ya existe el seed de Pollería El Pollón, te vincula como dueño (útil en desarrollo).
        </p>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={loading !== null}
          onClick={onLinkDemo}
        >
          {loading === 'demo' ? 'Vinculando…' : 'Usar El Pollón'}
        </Button>
      </div>
    </div>
  );
}
