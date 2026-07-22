'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { submitPaymentAction } from '@/app/(app)/wallet/actions';

export function PaymentForm({ maxDebt }: { maxDebt: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await submitPaymentAction(new FormData(event.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'OK');
    event.currentTarget.reset();
    router.refresh();
  }

  if (maxDebt <= 0) {
    return <p className="text-sm text-slate-600">No tienes deuda pendiente.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Input
        label="Monto a pagar (CLP)"
        name="amount"
        type="number"
        min={1}
        max={maxDebt}
        step={1}
        defaultValue={maxDebt}
        required
      />
      <Input label="Notas / referencia (opcional)" name="notes" />
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Enviando…' : 'Declarar pago de comisión'}
      </Button>
    </form>
  );
}
