# Fase 12 — Seguimiento público del cliente

## Objetivo

Permitir que el cliente vea el estado de su entrega **sin login**, con un enlace temporal basado en `tracking_token`.

## Migración

`supabase/migrations/20260721000019_tracking_fase12.sql`

| Pieza | Uso |
|-------|-----|
| Flag `public_tracking` | Se habilita (`enabled = TRUE`) |
| `get_public_tracking(p_token)` | RPC `SECURITY DEFINER` para `anon` + `authenticated` |

### Qué expone el RPC

- Número de pedido, estados (pedido + delivery)
- Comercio / sucursal
- Dirección de entrega, total, método de pago, monto a cobrar
- PIN de entrega (no el código de retiro)
- Solo el **nombre de pila** del repartidor
- Coordenadas local / entrega / GPS del driver (mientras la entrega está activa)
- `expires_at` del enlace

### Qué no expone

- `pickup_code`, IDs internos, teléfono/email del driver, ofertas, comisiones

Token inválido / expirado / flag off → `valid = false` + `error_code`.

## UI

| App | Ruta |
|-----|------|
| `customer-tracking` :3004 | `/` — pegar enlace o código |
| `customer-tracking` :3004 | `/t/[token]` — mapa, estado, PIN; poll cada 8 s |
| `merchant-web` :3002 | Detalle pedido → **Copiar enlace** tras asignar |

Base URL del enlace (merchant): `NEXT_PUBLIC_CUSTOMER_TRACKING_URL` (default `http://localhost:3004`).

## Aplicar en Supabase

Ejecuta: `20260721000019_tracking_fase12.sql`

```sql
SELECT proname FROM pg_proc WHERE proname = 'get_public_tracking';
SELECT key, enabled FROM public.feature_flags WHERE key = 'public_tracking';
```

O: `supabase/scripts/verificar_fase12.sql`

## Flujo de prueba

1. Merchant asigna un repartidor (acepta oferta)
2. En el detalle del pedido, copia el enlace `/t/...`
3. Ábrelo en ventana privada → `customer-tracking` :3004
4. Debe verse estado, mapa y PIN
5. Avanza el delivery; el cliente se actualiza al refrescar / poll
6. Tras 48 h (o si caducas el token a mano), debe mostrar enlace expirado

## Checklist

- [ ] Migración `00019` aplicada
- [ ] Flag `public_tracking` = true
- [ ] RPC responde a `anon`
- [ ] `/t/[token]` muestra mapa + PIN
- [ ] Merchant puede copiar el enlace
- [ ] No se muestra `pickup_code` al cliente
- [ ] `pnpm --filter @pedidosgo/customer-tracking typecheck` OK

## Próxima fase

**Fase 13** — Notificaciones in-app + ratings. Ver `docs/FASE-13.md`.
