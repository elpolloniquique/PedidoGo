# Fase 11 — Finanzas: comisiones y billetera

## Objetivo

Calcular la comisión de la plataforma al **entregar**, actualizar la billetera del repartidor y permitir declarar/revisar pagos de deuda.

## Modelo

- Base: tarifa de oferta aceptada → `fixed_fare` → `orders.delivery_fee`
- Comisión: regla activa en `commission_rules` (seed **0.5%** = `0.005`)
- Al entregar: ingreso (`earning`) + comisión (`commission`) → sube `current_debt`
- El driver declara un pago; el admin aprueba → baja la deuda

## Migración

`supabase/migrations/20260721000018_finance_fase11.sql`

| RPC | Uso |
|-----|-----|
| `apply_delivery_commission(request_id)` | Idempotente; crea `commissions` + wallet txs |
| `advance_delivery_status` | Llama comisión al pasar a `delivered` |
| `get_my_wallet()` | Resumen para el driver |
| `submit_commission_payment(amount, notes)` | Driver declara pago |
| `review_commission_payment(id, approve\|reject)` | Admin |
| `update_active_commission_percentage(...)` | Admin cambia % |

## UI

| App | Ruta |
|-----|------|
| `driver-pwa` :3003 | `/wallet` — saldo, deuda, movimientos, declarar pago |
| `admin-web` :3001 | `/finance` — regla, pagos pendientes, deudas, comisiones |

## Aplicar en Supabase

Ejecuta: `20260721000018_finance_fase11.sql`

```sql
SELECT proname FROM pg_proc
WHERE proname IN (
  'apply_delivery_commission',
  'get_my_wallet',
  'submit_commission_payment',
  'review_commission_payment',
  'update_active_commission_percentage'
)
ORDER BY 1;
```

O: `supabase/scripts/verificar_fase11.sql`

## Flujo de prueba

1. Completa una entrega hasta **Entregado**
2. Driver → `/wallet`: debe verse ingreso + comisión + deuda
3. Driver declara pago de la deuda
4. Admin → `/finance` → **Aprobar**
5. La deuda del driver baja

## Checklist

- [ ] Migración `00018` aplicada
- [ ] Entregar genera fila en `commissions`
- [ ] Wallet del driver actualizada
- [ ] Pago pending → approve reduce deuda
- [ ] Admin puede cambiar % de comisión
- [ ] `pnpm typecheck` / build OK

## Próxima fase

**Fase 12** — Seguimiento público del cliente (`customer-tracking` con token). Ver `docs/FASE-12.md`.
