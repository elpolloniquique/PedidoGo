'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { saveDriverVehicleAction } from '@/app/(app)/actions';
import { VEHICLE_TYPE_LABELS, type DriverVehicleRecord } from '@/lib/driver-constants';

export function VehicleForm({ vehicles }: { vehicles: DriverVehicleRecord[] }) {
  const router = useRouter();
  const primary = vehicles.find((v) => v.isPrimary) ?? vehicles[0];
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await saveDriverVehicleAction(new FormData(event.currentTarget));
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

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Tipo de vehículo</span>
        <select
          name="vehicleType"
          defaultValue={primary?.vehicleType ?? 'motorcycle'}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
          required
        >
          {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <Input label="Marca" name="brand" defaultValue={primary?.brand ?? ''} required />
      <Input label="Modelo" name="model" defaultValue={primary?.model ?? ''} required />
      <Input
        label="Año"
        name="year"
        type="number"
        defaultValue={primary?.year?.toString() ?? '2020'}
        required
      />
      <Input label="Color" name="color" defaultValue={primary?.color ?? ''} required />
      <Input
        label="Patente"
        name="licensePlate"
        defaultValue={primary?.licensePlate ?? ''}
        required
      />
      <Input label="Capacidad (opcional)" name="capacity" defaultValue={primary?.capacity ?? ''} />

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar vehículo'}
      </Button>
    </form>
  );
}
