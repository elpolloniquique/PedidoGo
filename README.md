# RapideX — Plataforma de delivery

Monorepo **Turborepo + pnpm** para **RapideX**: conecta comercios con repartidores independientes (modelo tipo negociación de tarifas).

> Nota técnica: los paquetes npm siguen el scope `@pedidosgo/*` (compatibilidad del monorepo). La marca visible es **RapideX**.

## Aplicaciones

| App | Puerto local | Descripción |
|-----|--------------|-------------|
| `admin-web` | 3001 | Panel superadministrador |
| `merchant-web` | 3002 | Panel del comercio |
| `driver-pwa` | 3003 | PWA del repartidor |
| `customer-tracking` | 3004 | Seguimiento público del cliente |

## Paquetes compartidos

- `@pedidosgo/config` — Marca y configuración central (**RapideX**)
- `@pedidosgo/types` — Tipos TypeScript
- `@pedidosgo/validation` — Esquemas Zod
- `@pedidosgo/ui` — Componentes UI base
- `@pedidosgo/supabase` — Clientes Supabase (browser/server)
- `@pedidosgo/maps` — Mapbox (geocoding, directions, MapView)
- `@pedidosgo/auth` — Utilidades de roles
- `@pedidosgo/shared` — Utilidades comunes

## Requisitos

- Node.js ≥ 20
- pnpm 9.x

## Inicio rápido

```bash
pnpm install
cp .env.example .env.local
pnpm dev
# o: pnpm --filter @pedidosgo/admin-web dev
```

## Scripts

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm format
```

## Infraestructura

- **Supabase** — Auth, PostgreSQL, PostGIS, Realtime, Storage
- **Mapbox** — Mapas y rutas
- **Vercel** — Despliegue de las 4 apps
- **GitHub** — https://github.com/elpolloniquique/PedidoGo

## Fase actual

Ver `docs/INDEX.md` y la última `docs/FASE-*.md`.

## Marca

**RapideX** se configura con `NEXT_PUBLIC_APP_*` en `.env.local` y en `app_settings` (Supabase).  
Si la BD ya tenía PedidosGo, ejecuta: `supabase/scripts/actualizar_marca_rapidex.sql`
