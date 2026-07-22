'use client';

import { Button } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { uploadDriverDocumentAction } from '@/app/(app)/actions';
import { DOCUMENT_TYPE_LABELS } from '@/lib/driver-constants';

export function DocumentUploadForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await uploadDriverDocumentAction(new FormData(event.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Subido');
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Tipo de documento</span>
        <select
          name="documentType"
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
          required
          defaultValue="id_front"
        >
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Archivo (JPG, PNG, WEBP o PDF)</span>
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="rounded-xl border border-slate-300 bg-white px-3 py-2"
        />
      </label>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Subiendo…' : 'Subir documento'}
      </Button>
    </form>
  );
}
