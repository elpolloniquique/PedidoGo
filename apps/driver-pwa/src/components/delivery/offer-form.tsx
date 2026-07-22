'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { submitOfferAction } from '@/app/(app)/delivery/actions';
import type { OpenDeliveryJob } from '@/lib/delivery-constants';

export function OfferForm({ job }: { job: OpenDeliveryJob }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const defaultPrice =
    job.fixedFare != null ? String(job.fixedFare) : job.myOfferPrice != null ? String(job.myOfferPrice) : '';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await submitOfferAction(new FormData(event.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Enviada');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-xl border border-slate-200 p-3">
      <input type="hidden" name="deliveryRequestId" value={job.deliveryRequestId} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Tu oferta ($)"
          name="offeredPrice"
          type="number"
          min={1}
          step={100}
          defaultValue={defaultPrice}
          required
          readOnly={job.fixedFare != null && job.dispatchMode === 'manual' ? false : false}
        />
        <Input
          label="Minutos estimados"
          name="estimatedMinutes"
          type="number"
          min={1}
          max={240}
        />
      </div>
      <Input label="Mensaje (opcional)" name="message" />
      <Button type="submit" size="md" disabled={loading}>
        {loading
          ? 'Enviando…'
          : job.myOfferStatus === 'pending'
            ? 'Actualizar oferta'
            : 'Enviar oferta'}
      </Button>
    </form>
  );
}
