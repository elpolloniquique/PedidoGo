# Fase 3 — Autenticación (RapideX)

## Objetivo

Registro, login, recuperación de contraseña, sesiones con cookies, perfiles, roles y rutas protegidas usando **Supabase Auth**.

## Qué se implementó

| Pieza | Detalle |
|-------|---------|
| Migración `20260721000011_auth_fase3.sql` | Trigger de registro con rol seguro + `get_my_roles` / `get_my_profile` |
| `@RapideX/validation` | login, register, forgot/update password, profile |
| `@RapideX/auth` | roles por app (`APP_ALLOWED_ROLES`) |
| `@RapideX/supabase` | `updateSession` para middleware |
| `admin-web` | Login, recuperación, dashboard y perfil (sin registro público) |
| `merchant-web` | Login + registro `merchant_owner` + panel |
| `driver-pwa` | Login + registro `driver` + panel |
| `customer-tracking` | Público (sin auth obligatoria; tracking por token en Fase 12) |

## Roles por aplicación

| App | Roles permitidos |
|-----|------------------|
| admin-web | `super_admin`, `platform_admin` |
| merchant-web | `merchant_owner`, `merchant_admin`, `merchant_operator` |
| driver-pwa | `driver` |

**Importante:** el registro público **no** puede crear `super_admin`. Ese rol se asigna solo por SQL.

## Aplicar migración Fase 3 (obligatorio)

En Supabase SQL Editor, ejecuta el archivo:

`supabase/migrations/20260721000011_auth_fase3.sql`

Verifica:

```sql
SELECT proname FROM pg_proc
WHERE proname IN ('get_my_roles', 'get_my_profile', 'handle_new_user');
```

## Crear el primer superadministrador

1. En Supabase → **Authentication** → **Users** → crea un usuario (o regístrate temporalmente y luego cambia el rol).
2. Copia el UUID del usuario.
3. Ejecuta:

```sql
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'PEGAR_UUID_AQUI'::uuid, r.id
FROM public.roles r
WHERE r.slug = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
```

4. Inicia sesión en http://localhost:3001/login

## Redirect URLs en Supabase Auth

Project Settings → Authentication → URL Configuration:

- Site URL: `http://localhost:3003` (o la app principal que uses)
- Redirect URLs adicionales:
  - `http://localhost:3001/auth/callback`
  - `http://localhost:3002/auth/callback`
  - `http://localhost:3003/auth/callback`
  - `http://localhost:3004/**`

## Probar localmente

```bash
cd C:\Users\tutac\PEDIDOS_GO\PedidoGo
pnpm --filter @RapideX/admin-web dev
pnpm --filter @RapideX/merchant-web dev
pnpm --filter @RapideX/driver-pwa dev
```

| Prueba | URL |
|--------|-----|
| Admin login | http://localhost:3001/login |
| Comercio registro | http://localhost:3002/register |
| Repartidor registro | http://localhost:3003/register |
| Sin sesión → redirect | http://localhost:3001/ |

## Checklist de cierre

- [ ] Migración `00011` aplicada
- [ ] `get_my_roles` y `get_my_profile` existen
- [ ] Superadmin creado por SQL
- [ ] Redirect URLs configuradas
- [ ] Login admin funciona
- [ ] Registro driver crea rol `driver` y fila en `drivers`
- [ ] Registro merchant crea rol `merchant_owner`
- [ ] Logout limpia sesión
- [ ] Recuperación de contraseña envía correo (si SMTP/Auth email está activo)
- [ ] `pnpm typecheck` y `pnpm build` OK

## Próxima fase

**Fase 4** — Flujo completo del repartidor (documentos, vehículo, solicitud, aprobación).
