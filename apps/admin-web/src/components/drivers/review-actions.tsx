'use client';

import { Button } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { reviewDriverAction } from '@/app/(app)/drivers/actions';

export function ReviewActions({ driverId }: { driverId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: string) {
    setLoading(action);
    setError(null);
    setMessage(null);
    const result = await reviewDriverAction(driverId, action, notes);
    setLoading(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'OK');
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Observaciones</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Motivo de rechazo o correcciones solicitadas"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!!loading}
          onClick={() => run('under_review')}
          variant="secondary"
        >
          {loading === 'under_review' ? '…' : 'Marcar en revisión'}
        </Button>
        <Button
          type="button"
          disabled={!!loading}
          onClick={() => run('changes_required')}
          variant="secondary"
        >
          {loading === 'changes_required' ? '…' : 'Pedir correcciones'}
        </Button>
        <Button type="button" disabled={!!loading} onClick={() => run('approve')}>
          {loading === 'approve' ? '…' : 'Aprobar'}
        </Button>
        <Button
          type="button"
          disabled={!!loading}
          onClick={() => run('reject')}
          variant="ghost"
        >
          {loading === 'reject' ? '…' : 'Rechazar'}
        </Button>
      </div>
    </div>
  );
}
