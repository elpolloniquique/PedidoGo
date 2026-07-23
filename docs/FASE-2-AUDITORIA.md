# Auditoría Fase 2 — RapideX

## Estado detectado (revisión local + tus capturas)

| Área | Estado | Notas |
|------|--------|-------|
| PostGIS | OK | Versión 3.3 |
| Tablas core | OK | app_settings, roles, merchants, drivers, orders |
| Seed roles | FAIL antes | Solo `super_admin` |
| Seed marca | FAIL antes | 0 filas públicas |
| Seed El Pollón | FAIL antes | 0 merchants |
| `.env` en apps | CORREGIDO | Las apps ahora cargan el `.env.local` de la raíz |
| Service role | Mejorado | Ya no es igual a la anon (`sb_secret_...`) |
| Mapbox secreto | FAIL | `MAPBOX_SECRET_TOKEN` empieza con `pk.` (debe ser `sk.`) |

## Acción obligatoria ahora

1. Abre `supabase/scripts/auditar_y_completar_fase2.sql`
2. Copia TODO el contenido al SQL Editor de Supabase
3. Ejecuta (Run)
4. Revisa la tabla final: **todos los chequeos deben decir `OK`**

## Mapbox (no bloquea Fase 2, sí Fase 8)

En [Mapbox Account → Access tokens](https://account.mapbox.com/access-tokens/):

- Token público → `NEXT_PUBLIC_MAPBOX_TOKEN` (`pk....`)
- Token secreto → `MAPBOX_SECRET_TOKEN` (`sk....`)  
  Si no tienes `sk.`, crea un token con secret scope o deja el placeholder hasta Fase 8.

## Reiniciar apps tras cambios de env

```bash
# Detén pnpm dev (Ctrl+C) y vuelve a levantar
cd C:\Users\tutac\PEDIDOS_GO\PedidoGo
pnpm --filter @RapideX/admin-web dev
```

## Criterio Fase 2 al 100%

- [ ] Informe SQL: 14/14 en `OK`
- [ ] Storage: 7 buckets visibles en Dashboard → Storage
- [ ] `.env.local` con URL + anon + service role distinta
- [ ] `pnpm typecheck` y `pnpm build` OK en local
- [ ] Mapbox secreto corregido (o documentado como pendiente Fase 8)
