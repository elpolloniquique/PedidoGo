# Operación diaria — RapideX / PedidosGo

Guía para quien opera la plataforma (admin, soporte técnico, dueño del negocio).

## Roles

| Rol | App | Qué hace |
|-----|-----|----------|
| Superadmin / platform_admin | admin-web | Aprueba drivers, finanzas, salud sistema |
| Merchant owner / operator | merchant-web | Pedidos, sucursales, ofertas, ratings |
| Driver aprobado | driver-pwa | Ofertas, entrega, GPS, wallet |
| Cliente | customer-tracking | Solo enlace `/t/TOKEN` (sin cuenta) |

## Puertos locales

```text
Admin     http://localhost:3001
Merchant  http://localhost:3002
Driver    http://localhost:3003
Tracking  http://localhost:3004
```

## Arranque local

```bash
cd PedidoGo
pnpm install
cp .env.example .env.local   # completar valores reales
pnpm --filter @pedidosgo/admin-web dev
# o pnpm dev para todas
```

Variables mínimas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`.

## Flujo operativo estándar

### Alta de repartidor
1. Driver se registra en `:3003`  
2. Completa datos, documentos, vehículo, envía solicitud  
3. Admin en `:3001` → Repartidores → aprueba  

### Pedido y entrega
1. Merchant crea pedido y publica  
2. Drivers ofertan en Pedidos  
3. Merchant acepta → copia enlace tracking para el cliente  
4. Driver avanza estados hasta Entregado  
5. Merchant califica; driver revisa wallet  

### Comisiones
1. Al entregar se calcula comisión (regla activa, seed 0.5%)  
2. Driver declara pago en Billetera  
3. Admin aprueba en Finanzas  

## Monitoreo

| Check | Dónde |
|-------|--------|
| App viva | `GET /api/health` en cada URL |
| Métricas negocio | Admin → **Sistema** (`/system`) |
| Errores cliente | Tabla `system_errors` (admin BD) |
| Realtime | Ofertas/GPS/notificaciones en vivo |

## Incidencias frecuentes

| Problema | Qué revisar |
|----------|-------------|
| Login falla en Vercel | Supabase Redirect URLs |
| Mapa vacío | `NEXT_PUBLIC_MAPBOX_TOKEN` + restricciones URL |
| Tracking “no encontrado” | Token, expiry 48h, flag `public_tracking` |
| Tracking rate limited | Demasiadas consultas; esperar 1 min |
| Sin ofertas | Driver aprobado + disponible; pedido publicado |
| Puerto EADDRINUSE | Matar proceso en 3001–3004 o cerrar terminal `dev` |
| Notificaciones vacías | Migración Fase 13 + Realtime `notifications` |

## Migraciones SQL

Se aplican **a mano** en SQL Editor de Supabase (orden por nombre de archivo).  
Tras cada fase: script `supabase/scripts/verificar_faseN.sql`.

## Marca (RapideX)

- Frontend: `.env.local` → `NEXT_PUBLIC_APP_*`  
- BD: `app_settings` o script `actualizar_marca_rapidex.sql`  

## Contacto / soporte plataforma

Configurado en `NEXT_PUBLIC_APP_SUPPORT_EMAIL` / `app_settings.app_support_email`.
