'use client';

import { Alert, Button } from '@pedidosgo/ui';
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
    <div className="space-y-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Observaciones (opcional al aprobar)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Motivo de rechazo o correcciones solicitadas"
        />
      </label>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      <Button
        type="button"
        size="lg"
        disabled={!!loading}
        onClick={() => run('approve')}
        className="w-full bg-emerald-700 text-white hover:bg-emerald-800"
      >
        {loading === 'approve' ? 'Aprobando…' : '✓ Aprobar solicitud'}
      </Button>

      <p className="text-xs text-[var(--color-ink-muted)]">
        Al aprobar, el repartidor queda habilitado para recibir pedidos.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          type="button"
          disabled={!!loading}
          onClick={() => run('under_review')}
          variant="secondary"
          className="w-full"
        >
          {loading === 'under_review' ? '…' : 'Marcar en revisión'}
        </Button>
        <Button
          type="button"
          disabled={!!loading}
          onClick={() => run('changes_required')}
          variant="secondary"
          className="w-full"
        >
          {loading === 'changes_required' ? '…' : 'Pedir correcciones'}
        </Button>
        <Button
          type="button"
          disabled={!!loading}
          onClick={() => run('reject')}
          variant="ghost"
          className="w-full border border-red-200 text-red-700 hover:bg-red-50"
        >
          {loading === 'reject' ? '…' : 'Rechazar'}
        </Button>
      </div>
    </div>
  );
}
