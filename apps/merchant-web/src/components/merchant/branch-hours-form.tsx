'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { updateBranchHoursAction } from '@/app/(app)/actions';
import { DAY_LABELS, type BranchHourRecord } from '@/lib/merchant-constants';

export function BranchHoursForm({
  branchId,
  hours,
}: {
  branchId: string;
  hours: BranchHourRecord[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await updateBranchHoursAction(branchId, new FormData(event.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Guardado');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="space-y-3">
        {hours.map((h) => (
          <div
            key={h.dayOfWeek}
            className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[7rem_1fr_1fr_auto]"
          >
            <p className="self-center text-sm font-medium text-slate-800">
              {DAY_LABELS[h.dayOfWeek]}
            </p>
            <Input
              label="Abre"
              name={`opensAt_${h.dayOfWeek}`}
              type="time"
              defaultValue={h.opensAt}
              required
            />
            <Input
              label="Cierra"
              name={`closesAt_${h.dayOfWeek}`}
              type="time"
              defaultValue={h.closesAt}
              required
            />
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name={`isClosed_${h.dayOfWeek}`}
                value="true"
                defaultChecked={h.isClosed}
                className="size-4 rounded border-slate-300"
              />
              Cerrado
            </label>
          </div>
        ))}
      </div>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar horarios'}
      </Button>
    </form>
  );
}
