'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type EvidenceItem = {
  evidenceId: string;
  evidenceType: string;
  storagePath: string;
  createdAt: string;
  url: string | null;
};

export function DeliveryEvidenceGallery({ items }: { items: Omit<EvidenceItem, 'url'>[] }) {
  const [withUrls, setWithUrls] = useState<EvidenceItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (items.length === 0) {
        setWithUrls([]);
        return;
      }
      const supabase = createClient();
      const next: EvidenceItem[] = [];
      for (const item of items) {
        const { data } = await supabase.storage
          .from('delivery-evidence')
          .createSignedUrl(item.storagePath, 3600);
        next.push({ ...item, url: data?.signedUrl ?? null });
      }
      if (!cancelled) setWithUrls(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Sin evidencias fotográficas.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {withUrls.map((item) => (
        <li key={item.evidenceId} className="overflow-hidden rounded-xl border border-slate-200">
          {item.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.evidenceType}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-slate-50 text-xs text-slate-400">
              Cargando…
            </div>
          )}
          <p className="px-2 py-1 text-[11px] text-slate-500">
            {new Date(item.createdAt).toLocaleString('es-CL')}
          </p>
        </li>
      ))}
    </ul>
  );
}
