# Fase 10 — Supabase Realtime

## Objetivo

Actualizar ofertas, estados de pedido/delivery y GPS del repartidor **en vivo**, sin polling cada 10 s.

## Qué se implementó

### Migración

`supabase/migrations/20260721000017_realtime_fase10.sql`

- Columnas `lat` / `lng` en `driver_current_locations` (payload Realtime usable)
- `upsert_my_location` actualizado para rellenarlas
- `REPLICA IDENTITY FULL` en tablas clave
- Publicación en `supabase_realtime`:
  - `orders`
  - `delivery_requests`
  - `delivery_offers`
  - `delivery_assignments`
  - `driver_current_locations`

### Merchant (`:3002`)

| Pieza | Efecto |
|-------|--------|
| `/orders` | Lista se refresca al crear/cambiar pedidos |
| `/orders/[id]` mapa | Ofertas/estados vía Realtime; GPS del driver en vivo (marker azul) |
| API poll 10 s | Ya no se usa en el mapa (queda el route por si hace falta debug) |

### Driver (`:3003`)

| Pieza | Efecto |
|-------|--------|
| `/jobs` | Se refresca al publicar/cerrar solicitudes u ofertas |
| `/delivery` | Se refresca al cambiar la entrega activa |

## Aplicar en Supabase

1. Ejecuta `20260721000017_realtime_fase10.sql`
2. Verifica:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

O: `supabase/scripts/verificar_fase10.sql`

> En el dashboard: **Database → Publications → supabase_realtime** debe listar esas tablas.

## Flujo de prueba

1. Abre detalle de pedido en comercio y `/jobs` en driver (dos ventanas)
2. Publica el pedido → el driver ve el job sin F5
3. Driver oferte → el comercio ve la oferta sin F5
4. Acepta oferta → ambos se actualizan
5. Driver con GPS activo → marker azul se mueve en el mapa del comercio

## Checklist

- [ ] Migración `00017` aplicada
- [ ] Tablas en publication `supabase_realtime`
- [ ] Ofertas aparecen en vivo en el comercio
- [ ] Jobs se actualizan en el driver
- [ ] GPS en vivo (sin intervalo 10 s)
- [ ] `pnpm typecheck` / build OK

## Próxima fase

**Fase 11** — Finanzas / comisiones / billetera. Ver `docs/FASE-11.md`.
