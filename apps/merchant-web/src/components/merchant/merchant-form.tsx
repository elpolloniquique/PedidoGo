'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { updateMerchantAction } from '@/app/(app)/actions';
import type { MerchantRecord } from '@/lib/merchant-constants';

export function MerchantForm({ merchant }: { merchant: MerchantRecord }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await updateMerchantAction(new FormData(event.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Guardado');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Input label="Nombre comercial" name="name" defaultValue={merchant.name} required />
      <Input
        label="Razón social"
        name="legalName"
        defaultValue={merchant.legalName ?? ''}
      />
      <Input
        label="Correo"
        name="email"
        type="email"
        defaultValue={merchant.email ?? ''}
      />
      <Input label="Teléfono" name="phone" defaultValue={merchant.phone ?? ''} />
      <Input
        label="Sitio web"
        name="websiteUrl"
        type="url"
        placeholder="https://"
        defaultValue={merchant.websiteUrl ?? ''}
      />
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar comercio'}
      </Button>
    </form>
  );
}
