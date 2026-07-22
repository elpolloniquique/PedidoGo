'use client';

import { AddressSearch, MapView, type GeocodeResult } from '@pedidosgo/maps';
import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createBranchAction, updateBranchAction } from '@/app/(app)/actions';
import type { BranchRecord } from '@/lib/merchant-constants';

type Props =
  | { mode: 'create' }
  | { mode: 'edit'; branch: BranchRecord };

export function BranchForm(props: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const branch = props.mode === 'edit' ? props.branch : null;
  const [addressLine, setAddressLine] = useState(branch?.addressLine ?? '');
  const [city, setCity] = useState(branch?.city ?? '');
  const [commune, setCommune] = useState(branch?.commune ?? '');
  const [region, setRegion] = useState(branch?.region ?? '');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  function onAddressSelect(result: GeocodeResult) {
    setAddressLine(result.addressLine ?? result.placeName);
    if (result.city) setCity(result.city);
    if (result.commune) setCommune(result.commune);
    if (result.region) setRegion(result.region);
    setLat(String(result.point.latitude));
    setLng(String(result.point.longitude));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const result =
      props.mode === 'create'
        ? await createBranchAction(formData)
        : await updateBranchAction(props.branch.id, formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Guardado');
    if (props.mode === 'create' && result.id) {
      router.push(`/branches/${result.id}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Input label="Nombre" name="name" defaultValue={branch?.name ?? ''} required />
      <Input label="Código" name="code" defaultValue={branch?.code ?? ''} />
      <AddressSearch label="Buscar dirección (Mapbox)" onSelect={onAddressSelect} />
      <Input
        label="Dirección"
        name="addressLine"
        value={addressLine}
        onChange={(e) => setAddressLine(e.target.value)}
        required
      />
      <Input
        label="Ciudad"
        name="city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
      />
      <Input
        label="Comuna"
        name="commune"
        value={commune}
        onChange={(e) => setCommune(e.target.value)}
        required
      />
      <Input
        label="Región"
        name="region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      />
      <input type="hidden" name="latitude" value={lat} />
      <input type="hidden" name="longitude" value={lng} />
      {lat && lng ? (
        <MapView
          height="200px"
          markers={[
            {
              id: 'branch',
              latitude: Number(lat),
              longitude: Number(lng),
              label: 'Sucursal',
              color: '#B45309',
            },
          ]}
        />
      ) : null}
      <Input label="Teléfono" name="phone" defaultValue={branch?.phone ?? ''} />
      {props.mode === 'edit' ? (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={branch?.isActive ?? true}
            className="size-4 rounded border-slate-300"
          />
          Sucursal activa
        </label>
      ) : null}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Guardando…' : props.mode === 'create' ? 'Crear sucursal' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
