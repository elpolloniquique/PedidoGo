# Fase 15 — Pruebas E2E + QA manual

## Objetivo

Automatizar smoke tests de las 4 apps y documentar un checklist manual del flujo completo de delivery.

## Paquete E2E

`packages/e2e` — Playwright

| Test | Qué valida |
|------|------------|
| `health.api.spec.ts` | `GET /api/health` en cada app |
| `smoke.public.spec.ts` | Login público / home tracking |
| `auth.optional.spec.ts` | Login merchant (solo si hay credenciales E2E) |

## Tests unitarios

`packages/validation` — Vitest (esquemas Zod de login/email/password)

## Comandos

```bash
# Unitarios
pnpm test:unit

# E2E (levanta las 4 apps con pnpm start si no están corriendo)
pnpm build
pnpm test:e2e

# Con apps ya en dev (más rápido en local)
pnpm dev   # en otra terminal
pnpm test:e2e

# UI interactiva Playwright
pnpm test:e2e:ui
```

### Credenciales opcionales (login E2E)

En `.env.local` (raíz):

```env
E2E_MERCHANT_EMAIL=tu-comercio@test.cl
E2E_MERCHANT_PASSWORD=tu_password
```

Sin ellas, el test de login se **omite** (skip).

### Saltar servidores automáticos

Si ya tienes todo en `pnpm dev`:

```bash
SKIP_E2E_SERVERS=1 pnpm test:e2e
```

## Checklist QA manual

Ver **`docs/QA-CHECKLIST.md`** — flujo completo pedido → entrega → finanzas → tracking → rating.

## CI

GitHub Actions ejecuta `pnpm test:unit` en cada push/PR.  
E2E en CI requiere `pnpm build` previo (job `e2e`).

## Checklist Fase 15

- [ ] `pnpm test:unit` pasa
- [ ] `pnpm build` + `pnpm test:e2e` pasa en local
- [ ] QA manual completado al menos una vez
- [ ] Login E2E opcional con usuario de prueba

## Próxima fase

**Fase 16** — Documentación final + handoff. Ver `docs/FASE-16.md` y `docs/INDEX.md`.
