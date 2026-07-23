# Backups y recuperación — RapideX / Supabase

## Qué respaldar

| Pieza | Dónde |
|-------|--------|
| Base de datos | Supabase (Postgres + PostGIS) |
| Auth users | Incluido en proyecto Supabase |
| Storage (docs / evidencia) | Buckets del proyecto |
| Código | GitHub `main` |
| Secrets | Gestor de secretos / 1Password (nunca en Git) |

## Backups en Supabase

1. Dashboard → **Project Settings → Database**  
2. Activar / revisar **Point-in-Time Recovery** (plan Pro+) o backups diarios del plan  
3. Descargas lógicas opcionales: `pg_dump` con connection string (solo desde red segura)

## Checklist semanal sugerido

- [ ] Confirmar último backup OK en Dashboard  
- [ ] `pnpm typecheck` en CI verde  
- [ ] Health de las 4 apps: `/api/health`  
- [ ] Revisar `/ops` → errores de sistema  
- [ ] Revisar tickets abiertos en `/support`

## Recuperación rápida

1. Restaurar DB desde backup Supabase (o PITR)  
2. Redeploy Vercel desde el commit conocido bueno  
3. Verificar Redirect URLs y tokens Mapbox  
4. Smoke QA: login admin + crear pedido merchant + oferta driver  

## Qué no hacer

- No subir `SERVICE_ROLE` ni dumps con PII a GitHub  
- No restaurar backups de staging sobre producción sin checklist
