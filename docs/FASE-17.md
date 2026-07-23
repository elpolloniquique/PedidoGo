# Fase 17 — Evidencia fotográfica de entrega

## Objetivo

Que el repartidor suba una **foto de evidencia** antes de marcar entregado, y que el comercio pueda verla en el detalle del pedido.

## Migración

`supabase/migrations/20260721000022_delivery_evidence_fase17.sql`

| Pieza | Uso |
|-------|-----|
| Flag `require_delivery_evidence` | Por defecto `TRUE` |
| RLS `delivery_evidence` | SELECT merchant/admin/driver; INSERT driver asignado |
| `register_delivery_evidence` | Tras upload a Storage |
| `list_delivery_evidence(order_id)` | Galería merchant/admin |
| `count_delivery_evidence` | Contador en UI driver |
| `advance_delivery_status` | Bloquea `delivered` sin foto (si flag activo) |

Bucket ya existente: `delivery-evidence` (path `{user_id}/...`).

## UI

| App | Qué |
|-----|-----|
| driver-pwa `/delivery` | Subir foto en estados hacia/con el cliente |
| merchant-web `/orders/[id]` | Galería con URLs firmadas |

## Aplicar en Supabase

Ejecuta: `20260721000022_delivery_evidence_fase17.sql`

Verifica: `supabase/scripts/verificar_fase17.sql`

## Flujo de prueba

1. Llevar entrega hasta “Hacia el cliente” o “Con el cliente”
2. Subir foto de evidencia
3. Marcar **Entregado** (sin foto debe fallar si el flag está activo)
4. Merchant abre el pedido → ve la foto

## Checklist

- [ ] Migración `00022` aplicada
- [ ] Flag `require_delivery_evidence` = true
- [ ] Driver puede subir foto
- [ ] Merchant ve galería
- [ ] Entregar sin foto falla con mensaje claro

## Próxima fase

**Fase 18** — Webhooks de comercio + tickets de soporte (ver `FASE-18.md`).
