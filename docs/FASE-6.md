# Fase 6 — Comercios, sucursales, horarios y despacho

## Objetivo

Permitir al comercio gestionar su ficha, sucursales, horarios, usuarios y el modo de despacho **manual / automático**.

## Qué se implementó

### Migración

`supabase/migrations/20260721000013_merchants_fase6.sql`

| Pieza | Función |
|-------|---------|
| Policy `merchants_owner_update` | Owner/admin del comercio puede editar su merchant |
| `get_my_merchant_ids()` | IDs de comercios del usuario |
| `bootstrap_my_merchant(name)` | Crea comercio + sucursal + settings + horas |
| `link_demo_merchant_el_pollon()` | Vincula al seed El Pollón |
| `link_merchant_user_by_email(...)` | Agrega usuario existente (bypass RLS profiles) |
| `list_my_merchant_members()` | Lista miembros con email/nombre |
| `handle_new_user` | Al registrar `merchant_owner` crea comercio completo |

### App comercio (`merchant-web` :3002)

| Ruta | Función |
|------|---------|
| `/onboarding` | Crear comercio o vincular El Pollón |
| `/` | Dashboard del comercio |
| `/merchant` | Editar datos del comercio |
| `/branches` | Listado de sucursales |
| `/branches/new` | Crear sucursal |
| `/branches/[id]` | Editar sucursal |
| `/branches/[id]/hours` | Horarios (dom–sáb) |
| `/branches/[id]/settings` | Modo manual/automático y parámetros |
| `/users` | Miembros + vincular por correo |

### Validación

Esquemas en `@pedidosgo/validation`: `merchantUpdateSchema`, `branchUpsertSchema`, `branchSettingsSchema`, `branchHoursSchema`, `merchantUserInviteSchema`.

## Aplicar en Supabase (obligatorio)

1. Ejecuta en SQL Editor el archivo completo:
   `20260721000013_merchants_fase6.sql`
2. Verifica:

```sql
SELECT proname FROM pg_proc
WHERE proname IN (
  'bootstrap_my_merchant',
  'link_demo_merchant_el_pollon',
  'link_merchant_user_by_email',
  'list_my_merchant_members',
  'get_my_merchant_ids'
);
```

O el script: `supabase/scripts/verificar_fase6.sql`

## Usuarios ya registrados sin comercio

Si te registraste como `merchant_owner` **antes** de esta migración:

1. Entra a http://localhost:3002 → te redirige a `/onboarding`
2. Pulsa **Crear comercio** o **Usar El Pollón**

Los registros nuevos ya crean comercio automáticamente.

## Flujo de prueba

```bash
pnpm --filter @pedidosgo/merchant-web dev
# http://localhost:3002
```

1. Registra un dueño en `/register` (o usa cuenta existente + onboarding)
2. Edita `/merchant`
3. Revisa sucursal → `/branches/.../settings` (cambia a automático)
4. Ajusta `/branches/.../hours`
5. En `/users`, vincula otro correo ya registrado como admin/operador

## Checklist

- [ ] Migración `00013` aplicada
- [ ] Onboarding crea o vincula comercio
- [ ] CRUD sucursales OK
- [ ] Horarios y settings se guardan
- [ ] Usuarios se listan y vinculan por email
- [ ] `pnpm typecheck` y `pnpm build` OK

## Próxima fase

**Fase 7** — Pedidos (creación, estados, ofertas de repartidores). Ver `docs/FASE-7.md`.
