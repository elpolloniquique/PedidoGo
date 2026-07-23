# Fase 19 — Dashboards, cron de webhooks y manuales

## Objetivo

1. **Dashboard analítico** para superadmin y resumen operativo para comercio.
2. **Despacho automático** de webhooks vía cron en Vercel.
3. **Manuales de rol** para operar la plataforma.

## Migración

`supabase/migrations/20260721000025_dashboards_cron_fase19.sql`

| RPC | Uso |
|-----|-----|
| `get_admin_dashboard_metrics()` | KPIs plataforma (admin) |
| `get_merchant_dashboard_metrics()` | KPIs del comercio |
| `claim_pending_webhook_deliveries` | También con `service_role` (cron) |

## UI

| App | Qué |
|-----|-----|
| admin-web `/dashboard` | Tarjetas: disponibles/ocupados/offline, pedidos, comisiones, tickets, webhooks |
| merchant-web `/` | Franja de métricas del día |

## Cron webhooks

Ruta: `merchant-web` → `GET/POST /api/cron/dispatch-webhooks`

1. En Vercel (proyecto merchant) agregá `CRON_SECRET`
2. `vercel.json` agenda cada 5 minutos
3. Auth: `Authorization: Bearer <CRON_SECRET>`

Prueba manual:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" \
  "https://pedido-go-merchant-web.vercel.app/api/cron/dispatch-webhooks"
```

## Manuales

| Doc | Audiencia |
|-----|-----------|
| [manuals/DESARROLLADOR.md](./manuals/DESARROLLADOR.md) | Dev / handoff técnico |
| [manuals/SUPERADMIN.md](./manuals/SUPERADMIN.md) | Panel admin |
| [manuals/COMERCIO.md](./manuals/COMERCIO.md) | Merchant |
| [manuals/REPARTIDOR.md](./manuals/REPARTIDOR.md) | Driver PWA |
| [manuals/PWA.md](./manuals/PWA.md) | Instalación PWA |
| [manuals/SUPABASE.md](./manuals/SUPABASE.md) | BD / migraciones |
| [manuals/MAPBOX.md](./manuals/MAPBOX.md) | Mapas |
| [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) | Despliegue |

## Aplicar en Supabase

Ejecutá: `20260721000025_dashboards_cron_fase19.sql`  
Verificá: `supabase/scripts/verificar_fase19.sql`

## Checklist

- [ ] Migración `00025` aplicada
- [ ] Admin ve `/dashboard` con números
- [ ] Merchant ve métricas en inicio
- [ ] `CRON_SECRET` en Vercel merchant
- [ ] Cron o curl despacha webhooks pendientes
