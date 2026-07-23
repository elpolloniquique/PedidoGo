# Fase 14 — Hardening y producción

## Objetivo

Preparar RapideX/RapideX para Vercel + Supabase en producción: cabeceras de seguridad, límites de abuso, salud operativa y checklist de despliegue.

## Migración

`supabase/migrations/20260721000021_production_fase14.sql`

| Pieza | Uso |
|-------|-----|
| `rpc_rate_limits` + `assert_rate_limit` | Límite simple por bucket/ventana |
| `get_public_tracking` | Rate limit 180 req/min (global tracking) |
| `report_client_error` | Errores de UI → `system_errors` |
| `get_platform_health` | Resumen solo admin |
| `prune_rpc_rate_limits` | Limpieza buckets antiguos |

## Frontend

| Pieza | Dónde |
|-------|--------|
| Cabeceras CSP / X-Frame / etc. | `@RapideX/config` → `buildSecurityHeaderRoutes()` en las 4 apps |
| `GET /api/health` | Las 4 apps (público, para monitoreo) |
| Admin `/system` | Panel de salud operativa |

## Despliegue Vercel

Guía paso a paso: **`docs/DEPLOY-VERCEL.md`**

Resumen: **4 proyectos**, mismo repo GitHub, Root Directory distinto por app.

## Aplicar en Supabase

Ejecuta: `20260721000021_production_fase14.sql`

Verifica: `supabase/scripts/verificar_fase14.sql`

## Checklist producción

### Supabase
- [ ] Todas las migraciones `00001`…`00021` aplicadas
- [ ] Auth → Redirect URLs con dominios `*.vercel.app` y producción
- [ ] `public_tracking` = `true` si usas tracking cliente
- [ ] RLS activo (no desactivar en prod)
- [ ] `service_role` **nunca** en el navegador

### Vercel (cada app)
- [ ] Root Directory correcto (`apps/...`)
- [ ] Variables `NEXT_PUBLIC_*` y secretos de servidor
- [ ] `NEXT_PUBLIC_CUSTOMER_TRACKING_URL` en merchant
- [ ] `/api/health` responde `{ ok: true }`

### Mapbox
- [ ] Token `pk.` restringido por URL de producción

### Seguridad
- [ ] `.env.local` fuera de Git
- [ ] Cabeceras visibles en DevTools → Network
- [ ] Admin → `/system` carga métricas

## Próxima fase

**Fase 15** — Pruebas E2E + checklist QA. Ver `docs/FASE-15.md` y `docs/QA-CHECKLIST.md`.
