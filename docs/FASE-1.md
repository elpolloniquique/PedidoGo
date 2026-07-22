# Fase 1 — Monorepo PedidosGo

## Objetivo

Crear la base del monorepo con Turborepo, pnpm, TypeScript estricto, cuatro aplicaciones Next.js y paquetes compartidos.

## Resultado esperado

- `pnpm install` sin errores
- `pnpm build` compila las 4 apps
- Cada app arranca en su puerto (3001–3004)
- Marca centralizada en `@pedidosgo/config`

## Estructura creada

```text
PedidoGo/
├── apps/
│   ├── admin-web/
│   ├── merchant-web/
│   ├── driver-pwa/
│   └── customer-tracking/
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   ├── supabase/
│   ├── maps/
│   ├── auth/
│   ├── config/
│   ├── shared/
│   ├── typescript-config/
│   ├── eslint-config/
│   └── tailwind-config/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── config.toml
├── docs/
├── .github/workflows/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

## Checklist de cierre

- [ ] `pnpm install`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm --filter @pedidosgo/admin-web dev` → http://localhost:3001
- [ ] `pnpm --filter @pedidosgo/merchant-web dev` → http://localhost:3002
- [ ] `pnpm --filter @pedidosgo/driver-pwa dev` → http://localhost:3003
- [ ] `pnpm --filter @pedidosgo/customer-tracking dev` → http://localhost:3004

## Próxima fase

**Fase 2** — Supabase: migraciones, roles, RLS, Storage, PostGIS, seed.
