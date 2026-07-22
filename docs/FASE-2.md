# Fase 2 — Supabase (PedidosGo)

## Objetivo

Base de datos PostgreSQL + PostGIS con tablas del dominio, RLS, Storage, funciones RPC y datos semilla.

## Migraciones incluidas

| Archivo | Contenido |
|---------|-----------|
| `20260721000001_extensions_enums.sql` | PostGIS, enums |
| `20260721000002_identity_permissions.sql` | Perfiles, roles, permisos |
| `20260721000003_merchants.sql` | Comercios y sucursales |
| `20260721000004_drivers.sql` | Repartidores |
| `20260721000005_orders_deliveries.sql` | Pedidos y delivery |
| `20260721000006_locations_finance_comms.sql` | GPS, finanzas, notificaciones |
| `20260721000007_auth_helpers_triggers.sql` | Triggers y helpers RLS |
| `20260721000008_rpc_postgis.sql` | RPC PostGIS |
| `20260721000009_rls_policies.sql` | Políticas RLS |
| `20260721000010_storage.sql` | Buckets Storage |

## Cómo aplicar

### Opción A — Supabase CLI (recomendado)

```bash
# Instalar CLI: https://supabase.com/docs/guides/cli
npm install -g supabase

cd C:\Users\tutac\PEDIDOS_GO\PedidoGo

# Vincular proyecto remoto (una vez)
supabase login
supabase link --project-ref TU_PROJECT_REF

# Aplicar migraciones + seed
supabase db push
supabase db seed
```

### Opción B — SQL Editor en Supabase Dashboard

1. Abre tu proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor**.
3. Ejecuta cada archivo de `supabase/migrations/` **en orden** (00001 → 00010).
4. Ejecuta `supabase/seed.sql`.

## Variables de entorno

Copia las claves de tu proyecto Supabase a `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Solo servidor / Edge Functions
```

## Buckets Storage

| Bucket | Público |
|--------|---------|
| `public-assets` | Sí |
| `merchant-logos` | Sí |
| `driver-profile-images` | No |
| `driver-documents` | No |
| `vehicle-documents` | No |
| `delivery-evidence` | No |
| `support-attachments` | No |

## RPC PostGIS

- `find_nearby_available_drivers(branch_id, radius_km, vehicle_type)`
- `calculate_driver_distance(driver_id, target_location)`
- `check_driver_inside_pickup_geofence(delivery_request_id, radius_m)`
- `check_driver_inside_delivery_geofence(delivery_request_id, radius_m)`
- `find_branch_service_zone(branch_id, location)`

## Seed incluido

- Roles y permisos base
- Configuración de marca **PedidosGo**
- Comisión 0.5%
- Comercio semilla **Pollería El Pollón** (sucursal principal)

## Crear superadministrador (manual)

Después de registrar un usuario en Auth:

```sql
-- Reemplaza USER_UUID por el id de auth.users
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'USER_UUID', r.id
FROM public.roles r
WHERE r.slug = 'super_admin';
```

## Checklist de cierre

- [ ] Migraciones aplicadas sin error
- [ ] `seed.sql` ejecutado
- [ ] PostGIS habilitado (`SELECT PostGIS_Version();`)
- [ ] Buckets visibles en Storage
- [ ] `.env.local` con URL y anon key
- [ ] Superadmin creado manualmente

## Próxima fase

**Fase 3** — Autenticación: registro, login, sesiones, perfiles, roles y rutas protegidas.
