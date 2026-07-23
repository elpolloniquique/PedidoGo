# Manual de Supabase

## Proyecto

Auth + Postgres + PostGIS + Realtime + Storage.

## Migraciones

Orden en `supabase/migrations/`:

`00001` … `00025` (última: dashboards / cron Fase 19)

Aplicar en SQL Editor (o CLI) en orden. Scripts de smoke: `supabase/scripts/verificar_fase*.sql`.

## Roles clave

`super_admin`, `platform_admin`, `merchant_owner`, `merchant_admin`, `merchant_operator`, `driver`, `support_agent`

## Redirect URLs (Auth)

Incluir todos los dominios `*.vercel.app` y localhost de las 4 apps. Ver [DEPLOY-VERCEL.md](../DEPLOY-VERCEL.md).

## Storage

Buckets: documentos de driver, evidencia de entrega, etc. Paths por `user_id`.

## Realtime

Publicación `supabase_realtime` para notificaciones y tracking según fases 10/13.
