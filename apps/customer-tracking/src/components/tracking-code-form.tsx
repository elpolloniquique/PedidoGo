'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { normalizeTrackingToken } from '@/lib/tracking';

export function TrackingCodeForm() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = normalizeTrackingToken(value);
    if (token.length < 16) {
      setError('Pega el enlace completo o el código de seguimiento.');
      return;
    }
    setError(null);
    router.push(`/t/${token}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Enlace o código"
        placeholder="Pega el enlace /t/... o el código"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" size="lg">
        Ver seguimiento
      </Button>
    </form>
  );
}
