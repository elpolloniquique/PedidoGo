-- PedidosGo Fase 8 — fix rápido si falló por RETURNS TABLE cambiado
-- Ejecuta esto completo en SQL Editor y luego vuelve a correr
-- 20260721000015_mapbox_fase8.sql (ya corregido en el repo)

DROP FUNCTION IF EXISTS public.list_open_delivery_jobs();
DROP FUNCTION IF EXISTS public.get_my_active_delivery();
