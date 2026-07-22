'use client';

import { Button } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { submitApplicationAction } from '@/app/(app)/actions';

export function SubmitApplicationButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await submitApplicationAction();
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Enviada');
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Button type="button" size="lg" disabled={disabled || loading} onClick={onSubmit}>
        {loading ? 'Enviando…' : 'Enviar solicitud'}
      </Button>
    </div>
  );
}
