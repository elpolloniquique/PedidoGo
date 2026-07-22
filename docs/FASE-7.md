# Fase 7 — Pedidos, estados y ofertas

## Objetivo

Permitir al comercio crear pedidos manuales, avanzar estados, publicar a repartidores y aceptar ofertas; y al repartidor ofertar y completar la entrega.

## Qué se implementó

### Migración

`supabase/migrations/20260721000014_orders_fase7.sql`

| RPC | Uso |
|-----|-----|
| `create_manual_order(...)` | Pedido + ítems + delivery_request |
| `update_order_status(...)` | Máquina de estados del pedido |
| `publish_delivery_request(...)` | Abre a ofertas / búsqueda |
| `submit_delivery_offer(...)` | Oferta del repartidor |
| `accept_delivery_offer(...)` | Comercio acepta oferta |
| `advance_delivery_status(...)` | Avance de la entrega |
| `list_open_delivery_jobs()` | Marketplace para drivers |
| `get_my_active_delivery()` | Entrega activa del driver |

También: policy marketplace para drivers, eventos de delivery SELECT, asignación vía SECURITY DEFINER.

**Automático + `first_accepted`**: la primera oferta válida se asigna sola.

### Merchant (`:3002`)

| Ruta | Función |
|------|---------|
| `/orders` | Listado |
| `/orders/new` | Crear pedido + ítems |
| `/orders/[id]` | Detalle, estados, publicar, aceptar ofertas |

### Driver (`:3003`)

| Ruta | Función |
|------|---------|
| `/jobs` | Pedidos abiertos + ofertar |
| `/delivery` | Entrega activa + avanzar estado |

## Aplicar en Supabase (obligatorio)

Ejecuta en SQL Editor:

`20260721000014_orders_fase7.sql`

Verifica:

```sql
SELECT proname FROM pg_proc
WHERE proname IN (
  'create_manual_order',
  'update_order_status',
  'publish_delivery_request',
  'submit_delivery_offer',
  'accept_delivery_offer',
  'advance_delivery_status',
  'list_open_delivery_jobs',
  'get_my_active_delivery'
)
ORDER BY 1;
```

O: `supabase/scripts/verificar_fase7.sql`

## Flujo de prueba

1. Comercio: http://localhost:3002/orders/new → crea pedido (opcional “Publicar ahora”)
2. Si no publicó: en el detalle → **Publicar a repartidores**
3. Repartidor aprobado: http://localhost:3003/jobs → envía oferta
4. Comercio: acepta oferta (o auto si modo automático + first_accepted)
5. Repartidor: `/delivery` → avanza hasta **Entregado**

## Checklist

- [ ] Migración `00014` aplicada
- [ ] Crear pedido con ítems
- [ ] Cambiar estados del pedido
- [ ] Publicar y ver ofertas
- [ ] Driver ofertar y completar entrega
- [ ] `pnpm typecheck` / `pnpm build` OK

## Próxima fase

**Fase 8** — Mapbox (mapas, geocodificación, rutas). Ver `docs/FASE-8.md`.
