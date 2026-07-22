'use client';

import { useEffect, useState } from 'react';
import { searchAddresses, type GeocodeResult } from '../geocoding';

export type AddressSearchProps = {
  label?: string;
  placeholder?: string;
  defaultQuery?: string;
  onSelect: (result: GeocodeResult) => void;
  className?: string;
};

export function AddressSearch({
  label = 'Buscar dirección',
  placeholder = 'Ej: Av. Providencia 1234, Santiago',
  defaultQuery = '',
  onSelect,
  className = '',
}: AddressSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      setLoading(true);
      const found = await searchAddresses(query, { limit: 5 });
      setResults(found);
      setLoading(false);
      setOpen(true);
    }, 350);

    return () => window.clearTimeout(handle);
  }, [query]);

  return (
    <div className={`relative flex w-full flex-col gap-1.5 text-sm ${className}`}>
      {label ? <span className="font-medium text-slate-700">{label}</span> : null}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        autoComplete="off"
      />
      {loading ? <span className="text-xs text-slate-500">Buscando…</span> : null}
      {open && results.length > 0 ? (
        <ul className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((r) => (
            <li key={`${r.placeName}-${r.point.latitude}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-teal-50"
                onClick={() => {
                  setQuery(r.placeName);
                  setOpen(false);
                  onSelect(r);
                }}
              >
                {r.placeName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
