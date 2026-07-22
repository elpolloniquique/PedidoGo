'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { updateBranchSettingsAction } from '@/app/(app)/actions';
import type { BranchSettingsRecord } from '@/lib/merchant-constants';

const STRATEGY_LABELS: Record<string, string> = {
  first_accepted: 'Primero en aceptar',
  nearest_driver: 'Más cercano',
  best_rating: 'Mejor calificación',
  lowest_price: 'Menor precio',
  fastest_arrival: 'Llegada más rápida',
  balanced_score: 'Puntaje equilibrado',
};

export function BranchSettingsForm({ settings }: { settings: BranchSettingsRecord }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await updateBranchSettingsAction(
      settings.branchId,
      new FormData(event.currentTarget),
    );
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

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Modo de despacho</span>
        <select
          name="deliveryDispatchMode"
          defaultValue={settings.deliveryDispatchMode}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
        >
          <option value="manual">Manual — eliges al repartidor</option>
          <option value="automatic">Automático — la plataforma asigna</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Estrategia automática</span>
        <select
          name="autoSelectionStrategy"
          defaultValue={settings.autoSelectionStrategy}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
        >
          {Object.entries(STRATEGY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <Input
        label="Radio de búsqueda (km)"
        name="defaultSearchRadiusKm"
        type="number"
        min={1}
        max={50}
        step={0.5}
        defaultValue={settings.defaultSearchRadiusKm}
        required
      />
      <Input
        label="Timeout de oferta (segundos)"
        name="offerTimeoutSeconds"
        type="number"
        min={30}
        max={900}
        defaultValue={settings.offerTimeoutSeconds}
        required
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="allowDriverOffers"
          value="true"
          defaultChecked={settings.allowDriverOffers}
          className="size-4 rounded border-slate-300"
        />
        Permitir ofertas de repartidores
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="allowFixedFare"
          value="true"
          defaultChecked={settings.allowFixedFare}
          className="size-4 rounded border-slate-300"
        />
        Permitir tarifa fija
      </label>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar configuración'}
      </Button>
    </form>
  );
}
