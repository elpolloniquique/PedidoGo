-- PedidosGo — verificación rápida Fase 9
SELECT proname
FROM pg_proc
WHERE proname IN (
  'upsert_my_location',
  'set_my_availability',
  'get_my_availability',
  'check_geofence_for_delivery',
  'get_order_driver_location'
)
ORDER BY 1;
