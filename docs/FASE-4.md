# Fase 4 — Repartidores (solicitud y aprobación)

## Objetivo

Permitir al repartidor completar datos, subir documentos, registrar vehículo, enviar solicitud; y al admin revisar / aprobar / rechazar / pedir correcciones.

## Qué se implementó

### Migración

`supabase/migrations/20260721000012_driver_application_flow.sql`

- Trigger `guard_driver_status_change` (el repartidor no puede auto-aprobarse)
- RPC `submit_driver_application()`
- RPC `review_driver_application(driver_id, action, notes)`

### App repartidor (`driver-pwa` :3003)

| Ruta | Función |
|------|---------|
| `/` | Checklist de progreso |
| `/onboarding` | Datos personales (RUT, dirección, emergencia) |
| `/documents` | Subida a bucket `driver-documents` |
| `/vehicle` | Registro de vehículo |
| `/application` | Estado + botón enviar |

### Admin (`admin-web` :3001)

| Ruta | Función |
|------|---------|
| `/drivers` | Listado de solicitudes |
| `/drivers/[id]` | Detalle + aprobar / rechazar / correcciones / en revisión |

## Aplicar en Supabase (obligatorio)

1. Ejecuta en SQL Editor el archivo completo:
   `20260721000012_driver_application_flow.sql`
2. Verifica:

```sql
SELECT proname FROM pg_proc
WHERE proname IN ('submit_driver_application', 'review_driver_application');
```

## Flujo de prueba

1. Registra un repartidor en http://localhost:3003/register
2. Completa `/onboarding`, `/documents`, `/vehicle`
3. Envía en `/application`
4. Entra como admin en http://localhost:3001/drivers
5. Abre la solicitud → **Aprobar** (o pedir correcciones)

## Checklist

- [ ] Migración `00012` aplicada
- [ ] Repartidor puede guardar datos y documentos
- [ ] Envío de solicitud cambia estado a `submitted`
- [ ] Admin ve el listado
- [ ] Admin puede aprobar / rechazar / pedir correcciones
- [ ] `pnpm typecheck` y `pnpm build` OK

## Próxima fase

**Fase 5** — PWA instalable (manifest, detección, guía Android/Apple, updates).
