-- PedidosGo Fase 10 — verificar SOLO la publication (ejecutar solo este bloque)
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
