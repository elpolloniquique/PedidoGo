# RapideX / PedidosGo — Plataforma de delivery

Monorepo **Turborepo + pnpm** que conecta comercios con repartidores independientes (negociación de tarifas, marca configurable).

> Documentación completa: **[docs/INDEX.md](docs/INDEX.md)**

## Estado

**MVP cerrado (fases 0–16):** código, BD, tests smoke y docs de handoff listos.  
Pendiente típico del cliente: deploys Vercel + QA en producción.

## Aplicaciones

| App | Puerto local | Descripción |
|-----|--------------|-------------|
| `admin-web` | 3001 | Panel superadministrador |
| `merchant-web` | 3002 | Panel del comercio |
| `driver-pwa` | 3003 | PWA del repartidor |
| `customer-tracking` | 3004 | Seguimiento público del cliente |

## Paquetes compartidos

- `@pedidosgo/config` — Marca, puertos, cabeceras de seguridad
- `@pedidosgo/types` — Tipos TypeScript
- `@pedidosgo/validation` — Esquemas Zod (+ Vitest)
- `@pedidosgo/ui` — Componentes UI base
- `@pedidosgo/supabase` — Clientes Supabase (browser/server)
- `@pedidosgo/maps` — Mapbox (geocoding, directions, MapView)
- `@pedidosgo/auth` — Utilidades de roles
- `@pedidosgo/shared` — Utilidades comunes
- `@pedidosgo/e2e` — Playwright smoke

## Requisitos

- Node.js ≥ 20
- pnpm 9.x

## Inicio rápido

```bash
pnpm install
cp .env.example .env.local
# Completa Supabase + Mapbox en .env.local

pnpm --filter @pedidosgo/merchant-web dev
# o: pnpm dev  (todas las apps)
```

## Scripts

```bash
pnpm build        # Build de todo el monorepo
pnpm lint         # ESLint
pnpm typecheck    # TypeScript
pnpm test:unit    # Vitest (validation)
pnpm test:e2e     # Playwright smoke (requiere build o dev)
pnpm format       # Prettier
```

## Documentación

| Guía | Archivo |
|------|---------|
| Índice | [docs/INDEX.md](docs/INDEX.md) |
| Arquitectura | [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) |
| Operación diaria | [docs/OPERACION.md](docs/OPERACION.md) |
| Deploy Vercel | [docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md) |
| QA manual | [docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md) |
| Handoff | [docs/HANDOFF.md](docs/HANDOFF.md) |
| Cierre fases | [docs/FASE-16.md](docs/FASE-16.md) |

## Infraestructura

- **Supabase** — Auth, PostgreSQL, PostGIS, Realtime, Storage
- **Mapbox** — Mapas, rutas, geocodificación
- **Vercel** — Despliegue de las 4 apps
- **GitHub Actions** — CI (typecheck, lint, build, unit, e2e)

## Fase actual

**Fase 17** — Evidencia fotográfica de entrega.

Ver [docs/FASE-17.md](docs/FASE-17.md).

Anteriores: [docs/FASE-1.md](docs/FASE-1.md) … [docs/FASE-16.md](docs/FASE-16.md).

## Marca

Nombre y colores vía `NEXT_PUBLIC_APP_*` y tabla `app_settings` en Supabase (script `supabase/scripts/actualizar_marca_rapidex.sql`).
