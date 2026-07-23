# Manual del desarrollador — RapideX

## Stack

Monorepo Turborepo + pnpm · Next.js 15 · Supabase · Mapbox · Vercel

## Setup

```bash
pnpm install
cp .env.example .env.local   # completar secretos
pnpm typecheck
pnpm --filter @pedidosgo/admin-web dev      # :3001
pnpm --filter @pedidosgo/merchant-web dev   # :3002
pnpm --filter @pedidosgo/driver-pwa dev     # :3003
pnpm --filter @pedidosgo/customer-tracking dev  # :3004
```

## Estructura

- `apps/*` — 4 frontends
- `packages/*` — UI, config, supabase, maps, validation
- `supabase/migrations` — SQL ordenado (`00001`…`00025`)
- `docs/` — fases, operación, handoff

## Convenciones

- TypeScript estricto, sin `any` injustificado
- RLS en todas las tablas de negocio
- RPCs `SECURITY DEFINER` con `search_path = public`
- Marca vía `@pedidosgo/config` / env (`NEXT_PUBLIC_APP_*`)

## Docs relacionadas

- [ARQUITECTURA.md](../ARQUITECTURA.md)
- [HANDOFF.md](../HANDOFF.md)
- [INDEX.md](../INDEX.md)
