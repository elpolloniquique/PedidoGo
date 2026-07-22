# PedidosGo — Plataforma de delivery

Monorepo **Turborepo + pnpm** para la plataforma PedidosGo: conecta comercios con repartidores independientes (modelo tipo negociación de tarifas, marca y código propios).

## Aplicaciones

| App | Puerto local | Descripción |
|-----|--------------|-------------|
| `admin-web` | 3001 | Panel superadministrador |
| `merchant-web` | 3002 | Panel del comercio |
| `driver-pwa` | 3003 | PWA del repartidor |
| `customer-tracking` | 3004 | Seguimiento público del cliente |

## Paquetes compartidos

- `@pedidosgo/config` — Marca y configuración central
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
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env.local

# Desarrollo (todas las apps)
pnpm dev

# O una app específica
pnpm --filter @pedidosgo/admin-web dev
```

## Scripts

```bash
pnpm build        # Build de todo el monorepo
pnpm lint         # ESLint
pnpm typecheck    # TypeScript
pnpm format       # Prettier
```

## Infraestructura (fases posteriores)

- **Supabase** — Auth, PostgreSQL, PostGIS, Realtime, Storage, Edge Functions
- **Mapbox** — Mapas, rutas, geocodificación
- **Vercel** — Despliegue de las 4 apps
- **GitHub Actions** — CI

## Fase actual

**Fase 13** — Notificaciones in-app + ratings de repartidor.

Ver `docs/FASE-13.md`.

Anteriores: `docs/FASE-1.md` … `docs/FASE-12.md`.

## Marca

El nombre **PedidosGo** y colores se configuran vía variables de entorno (`NEXT_PUBLIC_APP_*`) y en Fase 2 también en la tabla `app_settings` de Supabase.
