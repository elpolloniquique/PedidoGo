# Fase 20 — Operación avanzada de plataforma

> El prompt maestro original terminaba en la Fase 19. Esta fase continúa el producto en producción.

## Objetivo

Dar al superadmin control operativo sin tocar SQL:

1. **Feature flags** ON/OFF  
2. **App settings** (marca / textos)  
3. **Auditoría** de cambios  
4. **Errores de sistema/cliente**  
5. Guías de **dominios propios** y **backups**

## Migración

`supabase/migrations/20260721000026_ops_audit_flags_fase20.sql`

| RPC | Uso |
|-----|-----|
| `list_feature_flags` / `set_feature_flag` | Flags |
| `list_app_settings_admin` / `set_app_setting` | Settings |
| `list_audit_logs` | Bitácora |
| `list_system_errors` | Errores |
| `write_audit_log` | Helper interno |

## UI

Admin → **`/ops`** (también en nav **Operaciones**)

## Docs nuevas

| Doc | Contenido |
|-----|-----------|
| [DOMINIOS.md](./DOMINIOS.md) | Dominios custom en Vercel + Supabase + Mapbox |
| [BACKUPS.md](./BACKUPS.md) | Backups Supabase y checklist de recuperación |

## Aplicar en Supabase

```text
20260721000026_ops_audit_flags_fase20.sql
```

Verificar: `supabase/scripts/verificar_fase20.sql`

## Checklist

- [ ] Migración `00026` aplicada
- [ ] `/ops` lista flags y permite toggle
- [ ] Cambio de flag aparece en auditoría
- [ ] Settings editables
- [ ] Errores visibles (si hay reportes)

## Siguiente

Continúa en [FASE-21.md](./FASE-21.md) (API keys, preferencias de notificación, reportes CSV).
