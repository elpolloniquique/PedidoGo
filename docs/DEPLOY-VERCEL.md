# Despliegue en Vercel — RapideX

Guía para principiantes. Un repo, **cuatro proyectos** en Vercel.

## Repositorio

https://github.com/elpolloniquique/PedidoGo

## 1. Crear los 4 proyectos

En [vercel.com](https://vercel.com) → **Add New → Project** → importa **PedidoGo** (repite 4 veces).

| Proyecto Vercel | Root Directory |
|-----------------|----------------|
| `RapideX-admin` | `apps/admin-web` |
| `RapideX-merchant` | `apps/merchant-web` |
| `RapideX-driver` | `apps/driver-pwa` |
| `RapideX-tracking` | `apps/customer-tracking` |

- Framework: **Next.js**
- Build: por defecto (`pnpm build` desde la raíz del monorepo)

## 2. Variables de entorno

Copia desde tu `.env.local` (valores reales). En cada proyecto, marca **Production** y **Preview**.

```text
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_SHORT_NAME
NEXT_PUBLIC_APP_DESCRIPTION
NEXT_PUBLIC_APP_PRIMARY_COLOR
NEXT_PUBLIC_APP_SECONDARY_COLOR
NEXT_PUBLIC_APP_SUPPORT_EMAIL
NEXT_PUBLIC_APP_DOMAIN

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

NEXT_PUBLIC_MAPBOX_TOKEN
MAPBOX_SECRET_TOKEN
```

**Solo merchant** (después del deploy de tracking):

```text
NEXT_PUBLIC_CUSTOMER_TRACKING_URL=https://TU-tracking.vercel.app
CRON_SECRET=un_secreto_largo   # Fase 19: cron /api/cron/dispatch-webhooks
```

## 3. Supabase — Redirect URLs

**Authentication → URL Configuration** → Redirect URLs:

```text
https://TU-admin.vercel.app/**
https://TU-merchant.vercel.app/**
https://TU-driver.vercel.app/**
http://localhost:3001/**
http://localhost:3002/**
http://localhost:3003/**
```

## 4. Mapbox

Token `pk.` → restricciones por URL: tus `*.vercel.app` + localhost.

## 5. Verificar

Cada app:

```text
https://TU-app.vercel.app/api/health
```

Debe responder: `{"ok":true,"app":"...","at":"..."}`

Admin además: `/system` (métricas de plataforma).

## 6. Errores comunes

| Problema | Solución |
|----------|----------|
| Build falla `@RapideX/...` | Root Directory incorrecto |
| Login no funciona | Redirect URLs en Supabase |
| “Revisa tu correo para confirmar” | Ver sección **Confirmación de email** abajo |
| Mapa vacío | Falta `NEXT_PUBLIC_MAPBOX_TOKEN` |
| Enlace tracking a localhost | `NEXT_PUBLIC_CUSTOMER_TRACKING_URL` en merchant |

### Confirmación de email

Si al registrarte aparece *“Revisa tu correo…”* y no podés entrar:

1. **Supabase → Authentication → Providers → Email** → desactivá **Confirm email** (obligatorio para MVP; aplica a **cualquier** correo).
2. Ejecutá `supabase/scripts/confirmar_todos_emails_pendientes.sql` para liberar cuentas ya creadas.
3. Para un comercio específico: `supabase/scripts/activar_comercio_por_email.sql` (cambiás el email).
4. En Vercel (**driver y merchant**) debe existir `SUPABASE_SERVICE_ROLE_KEY`.
5. **Importante:** el proyecto merchant debe estar conectado a GitHub y redesplegarse. Si solo ves el mensaje viejo de “Revisa tu correo”, en Vercel → proyecto merchant → **Deployments → Redeploy** (Root Directory = `apps/merchant-web`).

Redirect URLs deben incluir:

```text
https://pedido-go-driver-pwa.vercel.app/**
https://pedido-go-merchant-web.vercel.app/**
```

## 7. Dominios propios (opcional)

Vercel → Project → **Domains** → añade `admin.tudominio.cl`, etc.  
Actualiza Redirect URLs en Supabase y Mapbox con los nuevos dominios.
