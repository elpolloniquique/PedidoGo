'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { saveDriverPersonalAction } from '@/app/(app)/actions';
import type { DriverRecord } from '@/lib/driver-constants';

export function PersonalForm({ driver }: { driver: DriverRecord }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const result = await saveDriverPersonalAction(formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Guardado');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Input label="RUT" name="rut" defaultValue={driver.rut ?? ''} required />
      <Input
        label="Fecha de nacimiento"
        name="birthDate"
        type="date"
        defaultValue={driver.birthDate ?? ''}
        required
      />
      <Input label="Región" name="region" defaultValue={driver.region ?? ''} required />
      <Input label="Ciudad" name="city" defaultValue={driver.city ?? ''} required />
      <Input label="Comuna" name="commune" defaultValue={driver.commune ?? ''} required />
      <Input
        label="Dirección"
        name="addressLine"
        defaultValue={driver.addressLine ?? ''}
        required
      />
      <Input
        label="Contacto de emergencia"
        name="emergencyContactName"
        defaultValue={driver.emergencyContactName ?? ''}
        required
      />
      <Input
        label="Teléfono de emergencia"
        name="emergencyContactPhone"
        defaultValue={driver.emergencyContactPhone ?? ''}
        required
      />
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar datos'}
      </Button>
    </form>
  );
}
