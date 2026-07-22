'use client';

import { Button } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { uploadDeliveryEvidenceAction } from '@/app/(app)/delivery/evidence-actions';

type Props = {
  deliveryRequestId: string;
  evidenceCount: number;
};

export function DeliveryEvidenceUpload({ deliveryRequestId, evidenceCount }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await uploadDeliveryEvidenceAction(new FormData(event.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Subida');
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <p className="font-semibold text-slate-900">Evidencia de entrega</p>
      <p className="mt-1 text-sm text-slate-600">
        Sube una foto al entregar (puerta, pedido, etc.). Fotos actuales:{' '}
        <strong>{evidenceCount}</strong>
      </p>

      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <input type="hidden" name="deliveryRequestId" value={deliveryRequestId} />
        <input type="hidden" name="evidenceType" value="photo_delivery" />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Foto</span>
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            required
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <Button type="submit" size="md" disabled={loading}>
          {loading ? 'Subiendo…' : 'Subir evidencia'}
        </Button>
      </form>
    </div>
  );
}
