# Handoff — Entrega del proyecto

Documento para transferir RapideX / PedidosGo a otro desarrollador u operador.

## Repositorio

- GitHub: https://github.com/elpolloniquique/PedidoGo  
- Monorepo: Turborepo + pnpm + Next.js 15  
- Rama principal: `main`  

## Stack

| Capa | Tecnología |
|------|------------|
| Apps | Next.js 15, React 19, Tailwind 4 |
| Monorepo | pnpm workspaces + Turborepo |
| Backend | Supabase (Auth, Postgres, PostGIS, Realtime, Storage) |
| Mapas | Mapbox GL + Directions/Geocoding |
| Tests | Vitest (unit) + Playwright (e2e smoke) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
| Deploy | Vercel (4 proyectos) |

## Accesos que debes pedir

1. GitHub del repo  
2. Proyecto Supabase (Dashboard + SQL Editor)  
3. Cuenta Vercel (4 apps)  
4. Token Mapbox (`pk.` y opcional `sk.`)  
5. Copia de `.env.local` (nunca en Git)  

## Primer día (checklist)

- [ ] Clonar repo, `pnpm install`  
- [ ] Configurar `.env.local` desde `.env.example`  
- [ ] Verificar Supabase: migraciones aplicadas hasta `00021`  
- [ ] `pnpm typecheck` y `pnpm test:unit`  
- [ ] Levantar al menos merchant + driver  
- [ ] Leer [INDEX.md](./INDEX.md), [ARQUITECTURA.md](./ARQUITECTURA.md), [OPERACION.md](./OPERACION.md)  
- [ ] Revisar [QA-CHECKLIST.md](./QA-CHECKLIST.md)  

## Estructura del repo

```text
PedidoGo/
  apps/
    admin-web/
    merchant-web/
    driver-pwa/
    customer-tracking/
  packages/
    config, ui, supabase, maps, validation, e2e, ...
  supabase/
    migrations/
    scripts/
    seed.sql
  docs/
  .github/workflows/ci.yml
```

## IDs seed útiles

| Entidad | UUID |
|---------|------|
| Merchant El Pollón | `a1000000-0000-4000-8000-000000000001` |
| Branch principal | `b1000000-0000-4000-8000-000000000001` |

## Estado del producto (cierre Fase 16)

### Completo (MVP producción)
Auth, drivers, PWA, comercios, pedidos/ofertas, Mapbox, GPS, Realtime, finanzas, tracking público, notificaciones, ratings, hardening, tests smoke, docs.

### Pendiente / opcional post-lanzamiento
- UI evidencia de entrega (foto) — **hecho en Fase 17**  
- Webhooks merchant  
- Módulo soporte / tickets  
- Edge Functions  
- Dashboards analíticos avanzados  
- Dominios propios + monitoreo externo (Sentry, etc.)  

## Comandos esenciales

```bash
pnpm install
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:e2e
pnpm --filter @pedidosgo/merchant-web dev
```

## Documentación clave

| Doc | Uso |
|-----|-----|
| [INDEX.md](./INDEX.md) | Mapa de toda la docs |
| [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) | Deploy |
| [FASE-16.md](./FASE-16.md) | Cierre de fases |
| `docs/FASE-1` … `FASE-15` | Historial técnico |

## Criterio de “proyecto entregado”

1. Código en GitHub actualizado  
2. Migraciones BD aplicadas en el proyecto Supabase del cliente  
3. 4 apps desplegables (o desplegadas) en Vercel  
4. Un recorrido QA del happy path documentado  
5. Esta carpeta `docs/` completa  

Fecha de handoff: completar al entregar → _______________  
Responsable salida: _______________  
Responsable recepción: _______________  
