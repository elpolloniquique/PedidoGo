'use client';

import { createSupabaseBrowserClient } from '@pedidosgo/supabase';
import { Alert } from '@pedidosgo/ui';
import { useCallback, useEffect, useState } from 'react';
import { TrackingMap } from '@/components/tracking-map';
import {
  DELIVERY_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  mapPublicTracking,
  trackingErrorMessage,
  type PublicTracking,
} from '@/lib/tracking';

const POLL_MS = 8000;

export function TrackingView({ token }: { token: string }) {
  const [data, setData] = useState<PublicTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: rows, error: rpcError } = await supabase.rpc('get_public_tracking', {
        p_token: token,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      const row = Array.isArray(rows) ? rows[0] : rows;
      setData(mapPublicTracking(row));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el seguimiento');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return <p className="text-sm text-slate-600">Cargando seguimiento…</p>;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!data?.valid) {
    return <Alert variant="error">{trackingErrorMessage(data?.errorCode ?? 'not_found')}</Alert>;
  }

  const deliveryLabel =
    DELIVERY_STATUS_LABELS[data.deliveryStatus ?? ''] ?? data.deliveryStatus ?? '—';
  const orderLabel = ORDER_STATUS_LABELS[data.orderStatus ?? ''] ?? data.orderStatus ?? '—';
  const addressParts = [
    data.deliveryAddress,
    data.deliveryCommune,
    data.deliveryCity,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-800">
          {data.merchantName}
          {data.branchName ? ` · ${data.branchName}` : ''}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">{data.orderNumber}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pedido: <strong>{orderLabel}</strong>
          {' · '}
          Entrega: <strong>{deliveryLabel}</strong>
        </p>
        {data.customerName ? (
          <p className="mt-1 text-sm text-slate-500">Para {data.customerName}</p>
        ) : null}
      </div>

      {data.deliveryPin && data.deliveryStatus !== 'delivered' && data.deliveryStatus !== 'cancelled' ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-wide text-teal-800">PIN de entrega</p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.2em] text-teal-950">
            {data.deliveryPin}
          </p>
          <p className="mt-1 text-xs text-teal-800/80">
            Entrégaselo al repartidor al recibir el pedido
          </p>
        </div>
      ) : null}

      {data.driverFirstName ? (
        <p className="text-sm text-slate-600">
          Repartidor: <strong>{data.driverFirstName}</strong>
        </p>
      ) : null}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Mapa</h3>
        <TrackingMap
          branchLat={data.branchLat}
          branchLng={data.branchLng}
          deliveryLat={data.deliveryLat}
          deliveryLng={data.deliveryLng}
          driverLat={data.driverLat}
          driverLng={data.driverLng}
          showDriver={data.showDriverLocation}
          branchLabel={data.branchName ?? 'Local'}
        />
        {data.showDriverLocation && data.driverRecordedAt ? (
          <p className="mt-1 text-xs text-slate-500">
            Última ubicación del repartidor:{' '}
            {new Date(data.driverRecordedAt).toLocaleTimeString('es-CL')}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
        <p>
          <span className="text-slate-500">Dirección: </span>
          {addressParts.join(', ') || '—'}
        </p>
        {data.total != null ? (
          <p className="mt-1">
            <span className="text-slate-500">Total: </span>$
            {data.total.toLocaleString('es-CL')}
            {data.paymentMethod ? ` · ${data.paymentMethod}` : ''}
          </p>
        ) : null}
        {data.amountToCollect != null && data.amountToCollect > 0 ? (
          <p className="mt-1">
            <span className="text-slate-500">Por cobrar: </span>$
            {data.amountToCollect.toLocaleString('es-CL')}
          </p>
        ) : null}
        {data.expiresAt ? (
          <p className="mt-2 text-xs text-slate-500">
            Enlace válido hasta {new Date(data.expiresAt).toLocaleString('es-CL')}
          </p>
        ) : null}
      </div>
    </div>
  );
}
