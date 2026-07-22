import { PaymentForm } from '@/components/wallet/payment-form';
import {
  getMyWallet,
  listMyCommissions,
  listMyPendingPayments,
  listMyWalletTransactions,
} from '@/lib/wallet';
import { requireDriver } from '@/lib/driver';
import { Alert } from '@pedidosgo/ui';
import { redirect } from 'next/navigation';

const TX_LABELS: Record<string, string> = {
  earning: 'Ingreso',
  commission: 'Comisión',
  payment: 'Pago',
  adjustment: 'Ajuste',
  bonus: 'Bono',
  penalty: 'Penalización',
};

export default async function WalletPage() {
  const { driver } = await requireDriver();
  if (driver.status !== 'approved') {
    redirect('/');
  }

  const [wallet, txs, commissions, payments] = await Promise.all([
    getMyWallet(),
    listMyWalletTransactions(),
    listMyCommissions(),
    listMyPendingPayments(),
  ]);

  return (
    <div className="space-y-6 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Billetera</h2>
      <Alert variant="info">
        La plataforma cobra comisión sobre la tarifa de delivery. Al entregar se calcula
        automáticamente.
      </Alert>

      {wallet ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Total ganado" value={wallet.totalEarned} />
          <Stat label="Comisión acumulada" value={wallet.totalCommission} />
          <Stat label="Comisión pagada" value={wallet.commissionPaid} />
          <Stat label="Deuda actual" value={wallet.currentDebt} highlight />
        </div>
      ) : (
        <p className="text-sm text-slate-600">Sin billetera aún.</p>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900">Pagar comisión</h3>
        <PaymentForm maxDebt={wallet?.currentDebt ?? 0} />
      </div>

      {payments.length > 0 ? (
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Tus pagos</h3>
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 p-3">
                <span>${Number(p.amount).toLocaleString('es-CL')}</span>
                <span className="text-slate-500">{p.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="mb-2 font-semibold text-slate-900">Últimas comisiones</h3>
        {commissions.length === 0 ? (
          <p className="text-sm text-slate-600">Aún no hay comisiones.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm">
            {commissions.map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>
                  Delivery ${c.deliveryAmount.toLocaleString('es-CL')} · comisión $
                  {c.commissionAmount.toLocaleString('es-CL')}
                </span>
                <span className="text-slate-500">
                  neto ${c.driverNetAmount.toLocaleString('es-CL')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-slate-900">Movimientos</h3>
        {txs.length === 0 ? (
          <p className="text-sm text-slate-600">Sin movimientos.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm">
            {txs.map((t) => (
              <li key={t.id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>
                  {TX_LABELS[t.type] ?? t.type}
                  {t.description ? ` · ${t.description}` : ''}
                </span>
                <span className="font-medium">${t.amount.toLocaleString('es-CL')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? 'border-amber-300 bg-amber-50/70' : 'border-slate-200'
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">${value.toLocaleString('es-CL')}</p>
    </div>
  );
}
