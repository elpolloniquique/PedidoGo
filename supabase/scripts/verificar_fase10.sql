-- PedidosGo — verificación rápida Fase 10
-- OJO: en SQL Editor, si pegas varios SELECT, a veces solo ves el ÚLTIMO resultado.
-- Para las 5 tablas, ejecuta solo el primer bloque (o usa verificar_fase10_solo_publication.sql).

-- 1) Publication Realtime (debe devolver 5 filas)
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'orders',
    'delivery_requests',
    'delivery_offers',
    'delivery_assignments',
    'driver_current_locations'
  )
ORDER BY 1;
