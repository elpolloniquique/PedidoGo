# Manual del superadministrador

App: **admin-web** (`/login`)

## Acceso

Solo roles `super_admin` o `platform_admin`.

## Módulos

| Ruta | Para qué |
|------|----------|
| `/dashboard` | KPIs en vivo (repartidores, pedidos, comisiones, tickets) |
| `/drivers` | Revisar y aprobar solicitudes |
| `/finance` | Comisión y pagos de deuda |
| `/system` | Salud de plataforma |
| `/ops` | Flags, auditoría, settings |
| `/reports` | Export CSV pedidos / repartidores / pagos |
| `/support` | Tickets de toda la red |
| `/profile` | Datos + preferencias de notificación |

## Flujo típico

1. Revisar `/dashboard`
2. Aprobar repartidores pendientes en `/drivers`
3. Confirmar pagos de comisión en `/finance`
4. Atender tickets en `/support`

## Notas

- Si el dashboard falla, falta la migración Fase 19 en Supabase.
- `/system` resume flags y colas internas (Fase 14).
