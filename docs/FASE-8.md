# Fase 8 — Mapbox (mapas, geocodificación, rutas)

## Objetivo

Integrar Mapbox GL JS en el monorepo: buscar direcciones, mostrar mapas, calcular rutas y persistir coordenadas en PostGIS.

## Qué se implementó

### Paquete `@RapideX/maps`

| API | Función |
|-----|---------|
| `geocodeAddress` / `searchAddresses` | Geocoding (Chile, proximidad Santiago) |
| `reverseGeocode` | Reverse geocoding |
| `getRoute` | Directions API (driving) |
| `MapView` | Mapa GL + markers + polyline |
| `AddressSearch` | Autocomplete de direcciones |
| `calculateFareSuggestion` | Sugerencia de tarifa por km |

Token público: `NEXT_PUBLIC_MAPBOX_TOKEN` (`pk.`).  
Token secreto: `MAPBOX_SECRET_TOKEN` (`sk.`) solo servidor (opcional; si falta se usa el público).

### Migración

`supabase/migrations/20260721000015_mapbox_fase8.sql`

- `set_order_delivery_location(order_id, lng, lat)`
- `set_branch_location(branch_id, lng, lat)`
- `get_order_map_points(order_id)`
- Amplía `list_open_delivery_jobs` / `get_my_active_delivery` con coordenadas
- Seed ubicación demo El Pollón (Santiago)

### UI

| App | Uso |
|-----|-----|
| `merchant-web` | Buscar dirección al crear pedido/sucursal; mapa + ruta en detalle de pedido |
| `driver-pwa` | Mapa y ruta en `/jobs` y `/delivery` |

## Aplicar en Supabase

Ejecuta: `20260721000015_mapbox_fase8.sql`

```sql
SELECT proname FROM pg_proc
WHERE proname IN (
  'set_order_delivery_location',
  'set_branch_location',
  'get_order_map_points'
);
```

## Configurar token

En `.env.local` (raíz PedidoGo):

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk....
MAPBOX_SECRET_TOKEN=sk....   # opcional pero recomendado
```

En [Mapbox Account](https://account.mapbox.com/access-tokens/):

1. Token público (`pk.`) con scopes de estilos + geocoding + directions
2. Restringe por URL (`localhost:3002`, `localhost:3003`, tu dominio Vercel)
3. Token secreto (`sk.`) solo para servidor — **no** lo pongas en `NEXT_PUBLIC_*`

## Checklist

- [ ] Migración `00015` aplicada
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` válido (`pk.`)
- [ ] Crear pedido con búsqueda de dirección → aparece pin
- [ ] Detalle de pedido muestra ruta si hay coords de sucursal + entrega
- [ ] Driver ve mapa en jobs/entrega
- [ ] `pnpm typecheck` / build OK

## Próxima fase

**Fase 9** — GPS del repartidor y geocercas PostGIS. Ver `docs/FASE-9.md`.
