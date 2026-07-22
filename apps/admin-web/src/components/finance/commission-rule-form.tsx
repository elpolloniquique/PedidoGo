'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { updateCommissionRateAction } from '@/app/(app)/finance/actions';

export function CommissionRuleForm({
  currentPercent,
  currentMinimum,
  currentMaximum,
}: {
  currentPercent: number;
  currentMinimum: number;
  currentMaximum: number | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await updateCommissionRateAction(new FormData(event.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'OK');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Input
        label="Porcentaje (%)"
        name="percent"
        type="number"
        min={0}
        max={100}
        step={0.01}
        defaultValue={currentPercent}
        required
      />
      <Input
        label="Mínimo comisión (CLP)"
        name="minimum"
        type="number"
        min={0}
        step={1}
        defaultValue={currentMinimum}
      />
      <Input
        label="Máximo comisión (CLP, vacío = sin tope)"
        name="maximum"
        type="number"
        min={0}
        step={1}
        defaultValue={currentMaximum ?? ''}
      />
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Guardando…' : 'Actualizar regla'}
      </Button>
    </form>
  );
}
