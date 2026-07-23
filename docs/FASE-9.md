# Fase 9 — GPS del repartidor y geocercas PostGIS

## Objetivo

Enviar la ubicación del repartidor, gestionar online/offline, validar llegada a tienda/cliente con geocercas y mostrar el GPS al comercio.

## Qué se implementó

### Migración

`supabase/migrations/20260721000016_gps_fase9.sql`

| RPC | Uso |
|-----|-----|
| `upsert_my_location(...)` | Upsert `driver_current_locations` + historial |
| `set_my_availability(available\|offline)` | Toggle en línea |
| `get_my_availability()` | Estado + última posición |
| `check_geofence_for_delivery(...)` | Distancia / dentro de radio 200 m + evento |
| `get_order_driver_location(order_id)` | Comercio ve GPS del asignado |

También: policies SELECT en `geofence_events` y `route_snapshots`.

### Driver PWA (`:3003`)

- Panel **Estado GPS** en inicio (activar GPS + ponerse en línea)
- En `/delivery`: GPS automático, marker azul “Tú”, geocerca al llegar
- Si estás fuera de 200 m: mensaje + opción “Confirmar de todos modos”
- Lock PWA `activeDelivery` mientras hay entrega activa

### Merchant (`:3002`)

- En detalle de pedido: marker del repartidor (poll cada 10 s vía `/api/driver-location`)

## Aplicar en Supabase

Ejecuta: `20260721000016_gps_fase9.sql`

```sql
SELECT proname FROM pg_proc
WHERE proname IN (
  'upsert_my_location',
  'set_my_availability',
  'get_my_availability',
  'check_geofence_for_delivery',
  'get_order_driver_location'
)
ORDER BY 1;
```

O: `supabase/scripts/verificar_fase9.sql`

## Flujo de prueba

1. Driver aprobado → Inicio → **Activar GPS** + **Ponerme en línea** (acepta permiso del navegador)
2. Comercio publica pedido → driver oferte y sea asignado
3. Driver en `/delivery` → marker azul se mueve; al “Llegué al local” valida geocerca
4. Comercio en `/orders/[id]` → ve punto azul del repartidor (si hay GPS reciente)

> En desktop el GPS es el de la máquina/IP; en celular real es más preciso. HTTPS (o localhost) requerido.

## Checklist

- [ ] Migración `00016` aplicada
- [ ] Permiso de ubicación OK
- [ ] `driver_current_locations` se actualiza
- [ ] Geocerca bloquea / permite forzar
- [ ] Comercio ve ubicación del driver
- [ ] `pnpm typecheck` / build OK

## Próxima fase

**Fase 10** — Realtime (ofertas, estados y GPS en vivo sin polling). Ver `docs/FASE-10.md`.
