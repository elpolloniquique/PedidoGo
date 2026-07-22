'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { submitDriverRatingAction } from '@/app/(app)/orders/actions';

type Props = {
  orderId: string;
  existingScore: number | null;
  existingComment: string | null;
  averageRating: number | null;
};

export function DriverRatingPanel({
  orderId,
  existingScore,
  existingComment,
  averageRating,
}: Props) {
  const router = useRouter();
  const [score, setScore] = useState(existingScore ?? 5);
  const [comment, setComment] = useState(existingComment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (existingScore != null) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm">
        <p className="font-semibold text-slate-900">Calificación del repartidor</p>
        <p className="mt-1 text-slate-700">
          Tu nota: <strong>{existingScore}/5</strong>
          {existingComment ? ` · “${existingComment}”` : ''}
        </p>
        {averageRating != null ? (
          <p className="mt-1 text-xs text-slate-500">
            Promedio del repartidor: {averageRating.toFixed(2)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <p className="font-semibold text-slate-900">Calificar repartidor</p>
      <p className="mt-1 text-sm text-slate-600">El pedido ya fue entregado. Deja una nota de 1 a 5.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            type="button"
            size="md"
            variant={score === n ? 'primary' : 'secondary'}
            onClick={() => setScore(n)}
          >
            {n}
          </Button>
        ))}
      </div>

      <div className="mt-3">
        <Input
          label="Comentario (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <Button
        type="button"
        size="md"
        className="mt-3"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await submitDriverRatingAction(orderId, score, comment);
          setBusy(false);
          if (!result.ok) {
            setError(result.message);
            return;
          }
          router.refresh();
        }}
      >
        Enviar calificación
      </Button>
    </div>
  );
}
