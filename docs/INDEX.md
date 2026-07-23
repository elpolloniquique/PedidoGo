# Índice de documentación — RapideX

## Guías operativas (empezar aquí)

| Doc | Para qué |
|-----|----------|
| [README.md](../README.md) | Setup local y visión general |
| [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) | Desplegar las 4 apps en Vercel |
| [OPERACION.md](./OPERACION.md) | Día a día: roles, flujos, incidencias |
| [ARQUITECTURA.md](./ARQUITECTURA.md) | Apps, paquetes, BD, Realtime |
| [QA-CHECKLIST.md](./QA-CHECKLIST.md) | Pruebas manuales antes de producción |
| [HANDOFF.md](./HANDOFF.md) | Entrega del proyecto a otro equipo |
| [FASE-16.md](./FASE-16.md) | Cierre del roadmap de fases |
| [manuals/](./manuals/) | Manuales por rol (Fase 19) |
| [DOMINIOS.md](./DOMINIOS.md) | Dominios propios (Fase 20) |
| [BACKUPS.md](./BACKUPS.md) | Backups y recuperación (Fase 20) |

## Fases de desarrollo (historial)

| Fase | Doc | Contenido |
|------|-----|-----------|
| 1 | [FASE-1.md](./FASE-1.md) | Monorepo Turborepo |
| 2 | [FASE-2.md](./FASE-2.md) | Supabase / BD / RLS |
| 3 | [FASE-3.md](./FASE-3.md) | Autenticación |
| 4 | [FASE-4.md](./FASE-4.md) | Onboarding repartidores |
| 5 | [FASE-5.md](./FASE-5.md) | PWA driver |
| 6 | [FASE-6.md](./FASE-6.md) | Comercios / sucursales |
| 7 | [FASE-7.md](./FASE-7.md) | Pedidos / ofertas |
| 8 | [FASE-8.md](./FASE-8.md) | Mapbox |
| 9 | [FASE-9.md](./FASE-9.md) | GPS / geocercas |
| 10 | [FASE-10.md](./FASE-10.md) | Realtime |
| 11 | [FASE-11.md](./FASE-11.md) | Finanzas / wallet |
| 12 | [FASE-12.md](./FASE-12.md) | Tracking público |
| 13 | [FASE-13.md](./FASE-13.md) | Notificaciones + ratings |
| 14 | [FASE-14.md](./FASE-14.md) | Hardening / producción |
| 15 | [FASE-15.md](./FASE-15.md) | Tests E2E + QA |
| 16 | [FASE-16.md](./FASE-16.md) | Docs finales / cierre |
| 17 | [FASE-17.md](./FASE-17.md) | Evidencia fotográfica de entrega |
| 18 | [FASE-18.md](./FASE-18.md) | Webhooks comercio + tickets soporte |
| 19 | [FASE-19.md](./FASE-19.md) | Dashboards, cron webhooks, manuales |
| 20 | [FASE-20.md](./FASE-20.md) | Ops: flags, auditoría, errores, dominios/backups |
| 21 | [FASE-21.md](./FASE-21.md) | API keys comercio, preferencias notif, reportes CSV |

## Scripts SQL útiles

Carpeta `supabase/scripts/`:

- `verificar_fase*.sql` — smoke por fase
- `auditar_y_completar_fase2.sql` — auditoría BD
- `actualizar_marca_rapidex.sql` — marca en `app_settings`
- `fix_fase10_publication.sql` — Realtime publication
