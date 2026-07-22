'use client';

import { AddressSearch, MapView, type GeocodeResult } from '@pedidosgo/maps';
import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { createOrderAction } from '@/app/(app)/orders/actions';
import type { BranchRecord } from '@/lib/merchant-constants';

type DraftItem = {
  key: string;
  productName: string;
  quantity: string;
  unitPrice: string;
};

export function CreateOrderForm({ branches }: { branches: BranchRecord[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [commune, setCommune] = useState('');
  const [city, setCity] = useState('Santiago');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [items, setItems] = useState<DraftItem[]>([
    { key: '1', productName: '', quantity: '1', unitPrice: '' },
  ]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  function onAddressSelect(result: GeocodeResult) {
    setAddress(result.addressLine ?? result.placeName);
    if (result.commune) setCommune(result.commune);
    if (result.city) setCity(result.city);
    setLat(String(result.point.latitude));
    setLng(String(result.point.longitude));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: String(Date.now()), productName: '', quantity: '1', unitPrice: '' },
    ]);
  }

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.key !== key)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set(
      'itemsJson',
      JSON.stringify(
        items.map((i) => ({
          productName: i.productName,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      ),
    );

    const result = await createOrderAction(formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'Creado');
    if (result.id) {
      router.push(`/orders/${result.id}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Sucursal</span>
        <select
          name="branchId"
          required
          defaultValue={branches[0]?.id ?? ''}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Cliente" name="customerName" required />
        <Input label="Teléfono" name="customerPhone" required />
      </div>

      <AddressSearch onSelect={onAddressSelect} />
      <Input
        label="Dirección de entrega"
        name="deliveryAddress"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Comuna"
          name="deliveryCommune"
          value={commune}
          onChange={(e) => setCommune(e.target.value)}
          required
        />
        <Input
          label="Ciudad"
          name="deliveryCity"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
      </div>
      <input type="hidden" name="deliveryLat" value={lat} />
      <input type="hidden" name="deliveryLng" value={lng} />

      {lat && lng ? (
        <MapView
          height="220px"
          markers={[
            {
              id: 'delivery',
              latitude: Number(lat),
              longitude: Number(lng),
              label: 'Entrega',
              color: '#0F766E',
            },
          ]}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Depto / casa" name="deliveryApartment" />
        <Input label="Referencias" name="deliveryReferences" />
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Ítems</h3>
          <Button type="button" variant="ghost" size="md" onClick={addItem}>
            + Ítem
          </Button>
        </div>
        {items.map((item) => (
          <div key={item.key} className="grid gap-2 sm:grid-cols-[1fr_5rem_6rem_auto]">
            <Input
              label="Producto"
              value={item.productName}
              onChange={(e) => updateItem(item.key, { productName: e.target.value })}
              required
            />
            <Input
              label="Cant."
              type="number"
              min={0.01}
              step={0.01}
              value={item.quantity}
              onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
              required
            />
            <Input
              label="Precio"
              type="number"
              min={0}
              step={0.01}
              value={item.unitPrice}
              onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="self-end"
              onClick={() => removeItem(item.key)}
            >
              Quitar
            </Button>
          </div>
        ))}
        <p className="text-sm text-slate-600">
          Subtotal: <strong>${subtotal.toLocaleString('es-CL')}</strong>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Pago</span>
          <select
            name="paymentMethod"
            defaultValue="cash"
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <Input
          label="Cobrar al cliente"
          name="amountToCollect"
          type="number"
          min={0}
          step={0.01}
          defaultValue={0}
        />
        <Input
          label="Fee delivery (opcional)"
          name="deliveryFee"
          type="number"
          min={0}
          step={0.01}
          defaultValue={0}
        />
      </div>
      <Input
        label="Tarifa fija sugerida (opcional)"
        name="fixedFare"
        type="number"
        min={0}
        step={0.01}
      />
      <Input label="Notas" name="notes" />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="publish"
          value="true"
          className="size-4 rounded border-slate-300"
        />
        Publicar ahora a repartidores
      </label>

      <Button type="submit" size="lg" disabled={loading || branches.length === 0}>
        {loading ? 'Creando…' : 'Crear pedido'}
      </Button>
    </form>
  );
}
