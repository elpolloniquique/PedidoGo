# Fase 18 — Webhooks de comercio + tickets de soporte

## Objetivo

Permitir que el comercio reciba **eventos HTTP** (webhooks) y que usuarios abran **tickets de soporte** desde admin, comercio y repartidor.

## Migración

`supabase/migrations/20260721000024_webhooks_support_fase18.sql`

### Webhooks

| RPC | Uso |
|-----|-----|
| `create_merchant_webhook` | Alta HTTPS + secreto (se muestra una vez) |
| `list_merchant_webhooks` | Listado |
| `set_merchant_webhook_active` | Pausar / activar |
| `delete_merchant_webhook` | Borrar |
| `test_merchant_webhook` | Encola `webhook.test` |
| `claim_pending_webhook_deliveries` | Cola para despacho |
| `mark_webhook_event_result` | Marca delivered/failed |
| `list_merchant_webhook_events` | Historial |

- Trigger en `order_status_history` → evento `order.status_changed`
- Firma: header `X-RapideX-Signature: sha256=<hmac>`

### Soporte

| RPC | Uso |
|-----|-----|
| `create_support_ticket` | Alta + primer mensaje |
| `add_support_message` | Respuesta |
| `set_support_ticket_status` | open / in_progress / resolved / closed |
| `list_support_tickets` | Lista (propios o todos si admin) |
| `get_support_ticket_thread` | Hilo completo |

## UI

| App | Ruta |
|-----|------|
| merchant-web | `/webhooks`, `/support` |
| admin-web | `/support` |
| driver-pwa | `/support` |

Despacho: botón **Despachar pendientes** / **Probar** en merchant (POST desde el servidor Next.js).

## Aplicar en Supabase

Ejecutá: `20260721000024_webhooks_support_fase18.sql`

Verificá: `supabase/scripts/verificar_fase18.sql`

## Checklist

- [ ] Migración `00024` aplicada
- [ ] Comercio crea webhook HTTPS y copia el secreto
- [ ] Probar webhook encola y despacha
- [ ] Cambio de estado de pedido genera evento
- [ ] Usuario crea ticket y ve el hilo
- [ ] Admin puede cambiar estado del ticket

## Próxima fase sugerida

**Fase 19** — Dashboards, cron de webhooks y manuales (ver `FASE-19.md`).
