'use client';

import { Button } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { reviewPaymentAction } from '@/app/(app)/finance/actions';

export function PaymentReviewButtons({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: 'approve' | 'reject') {
    setBusy(true);
    setError(null);
    const result = await reviewPaymentAction(paymentId, action);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" size="md" disabled={busy} onClick={() => run('approve')}>
          Aprobar
        </Button>
        <Button
          type="button"
          size="md"
          variant="ghost"
          disabled={busy}
          onClick={() => run('reject')}
        >
          Rechazar
        </Button>
      </div>
    </div>
  );
}
