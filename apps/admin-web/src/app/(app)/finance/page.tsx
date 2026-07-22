import { CommissionRuleForm } from '@/components/finance/commission-rule-form';
import { PaymentReviewButtons } from '@/components/finance/payment-review-buttons';
import {
  getActiveCommissionRule,
  listPendingPayments,
  listRecentCommissions,
  listWalletsWithDebt,
} from '@/lib/finance';
import { Alert } from '@pedidosgo/ui';

export default async function FinancePage() {
  const [rule, commissions, wallets, payments] = await Promise.all([
    getActiveCommissionRule(),
    listRecentCommissions(),
    listWalletsWithDebt(),
    listPendingPayments(),
  ]);

  const percent = rule ? Number(rule.percentage) * 100 : 0.5;

  return (
    <div className="space-y-8 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Finanzas</h2>
        <Alert variant="info">
          Comisión activa:{' '}
          <strong>{percent.toLocaleString('es-CL', { maximumFractionDigits: 2 })}%</strong>
          {rule ? ` · ${rule.name}` : ' · (fallback 0.5%)'}
        </Alert>
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Regla de comisión</h3>
        <CommissionRuleForm
          currentPercent={percent}
          currentMinimum={rule ? Number(rule.minimum_commission) : 0}
          currentMaximum={
            rule?.maximum_commission != null ? Number(rule.maximum_commission) : null
          }
        />
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Pagos pendientes de revisión</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-600">No hay pagos pendientes.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">${Number(p.amount).toLocaleString('es-CL')}</p>
                  <p className="text-xs text-slate-500">
                    Driver {p.driver_id.slice(0, 8)}… · {p.notes || 'sin notas'}
                  </p>
                </div>
                <PaymentReviewButtons paymentId={p.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Wallets con deuda</h3>
        {wallets.length === 0 ? (
          <p className="text-sm text-slate-600">Nadie con deuda.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm">
            {wallets.map((w) => (
              <li key={w.id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>Driver {w.driver_id.slice(0, 8)}…</span>
                <span className="font-medium text-amber-800">
                  Deuda ${Number(w.current_debt).toLocaleString('es-CL')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Comisiones recientes</h3>
        {commissions.length === 0 ? (
          <p className="text-sm text-slate-600">Aún no hay comisiones (se crean al entregar).</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm">
            {commissions.map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>
                  ${Number(c.delivery_amount).toLocaleString('es-CL')} → comisión $
                  {Number(c.commission_amount).toLocaleString('es-CL')}
                </span>
                <span className="text-slate-500">
                  {new Date(c.created_at).toLocaleString('es-CL')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
