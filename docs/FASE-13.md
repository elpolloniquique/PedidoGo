# Fase 13 — Notificaciones in-app + ratings

## Objetivo

Avisar en la app (sin push externo) de eventos clave, y permitir al comercio calificar al repartidor tras entregar.

## Migración

`supabase/migrations/20260721000020_notifications_ratings_fase13.sql`

### Notificaciones

| Pieza | Uso |
|-------|-----|
| `create_in_app_notification` | Inserta si `in_app_enabled` |
| `notify_branch_users` / `notify_driver_user` | Destinatarios |
| Triggers | Oferta nueva, asignación, cambio de status, pago comisión, estado driver |
| `mark_my_notification_read` / `mark_all_my_notifications_read` | Inbox |
| `get_my_unread_notification_count` | Badge |
| Realtime | Tabla `notifications` en `supabase_realtime` |

### Ratings

| Pieza | Uso |
|-------|-----|
| Índice único `order_id` | Una calificación por pedido |
| `submit_driver_rating(order, score, comment)` | Comercio/admin tras `delivered` |
| `get_order_rating(order)` | Ver si ya calificó |
| Actualiza `drivers.average_rating` | Promedio |

## UI

| App | Qué |
|-----|-----|
| merchant / driver / admin | Botón **Avisos** (campana) en el nav |
| merchant `/orders/[id]` | Panel calificar si `delivered` |

## Aplicar en Supabase

Ejecuta: `20260721000020_notifications_ratings_fase13.sql`

O verifica: `supabase/scripts/verificar_fase13.sql`

## Flujo de prueba

1. Driver envía oferta → merchant ve aviso en **Avisos**
2. Merchant acepta → ambos reciben aviso
3. Avanzar delivery → avisos de estado
4. Entregar → merchant califica 1–5
5. Driver recibe aviso de calificación; `average_rating` sube

## Checklist

- [ ] Migración `00020` aplicada
- [ ] `notifications` en publication Realtime
- [ ] Campana en las 3 apps autenticadas
- [ ] Rating solo en pedidos entregados
- [ ] Sin push externo (FCM/OneSignal)
- [ ] Typecheck / build OK

## Próxima fase

**Fase 15** — Pruebas E2E + checklist QA manual.
