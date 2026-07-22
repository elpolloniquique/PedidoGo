'use client';

import { Button } from '@pedidosgo/ui';
import { useState } from 'react';

function trackingBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const fromEnv = process.env.NEXT_PUBLIC_CUSTOMER_TRACKING_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, '');
  }
  return (process.env.NEXT_PUBLIC_CUSTOMER_TRACKING_URL ?? 'http://localhost:3004').replace(
    /\/$/,
    '',
  );
}

export function TrackingLinkCard({
  token,
  expiresAt,
}: {
  token: string;
  expiresAt: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${trackingBaseUrl()}/t/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white/80 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Enlace de seguimiento (cliente)
      </p>
      <p className="mt-1 break-all font-mono text-xs text-slate-700">{url}</p>
      {expiresAt ? (
        <p className="mt-1 text-xs text-slate-500">
          Válido hasta {new Date(expiresAt).toLocaleString('es-CL')}
        </p>
      ) : null}
      <Button type="button" size="md" variant="secondary" className="mt-2" onClick={() => void copy()}>
        {copied ? 'Copiado' : 'Copiar enlace'}
      </Button>
    </div>
  );
}
