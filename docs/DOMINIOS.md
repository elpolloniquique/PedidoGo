# Dominios propios — RapideX

## Objetivo

Usar dominios como:

- `admin.tudominio.cl`
- `app.tudominio.cl` (comercio)
- `driver.tudominio.cl`
- `track.tudominio.cl`

## Pasos Vercel

1. Cada proyecto → **Settings → Domains** → agregar el host  
2. Crear registros DNS según indique Vercel (`CNAME` / `A`)  
3. Esperar certificado SSL  

## Supabase Auth

**Authentication → URL Configuration → Redirect URLs** — agregar:

```text
https://admin.tudominio.cl/**
https://app.tudominio.cl/**
https://driver.tudominio.cl/**
http://localhost:3001/**
http://localhost:3002/**
http://localhost:3003/**
```

Site URL: la del panel principal o la que uses como “home” de auth.

## Mapbox

Token `pk.` → URL restrictions con los nuevos dominios.

## Variables

Actualizar en Vercel (y `.env.local`):

```text
NEXT_PUBLIC_APP_DOMAIN=tudominio.cl
NEXT_PUBLIC_CUSTOMER_TRACKING_URL=https://track.tudominio.cl
NEXT_PUBLIC_ADMIN_URL=https://admin.tudominio.cl
NEXT_PUBLIC_MERCHANT_URL=https://app.tudominio.cl
NEXT_PUBLIC_DRIVER_URL=https://driver.tudominio.cl
```

Redeploy después de cambiar env.
