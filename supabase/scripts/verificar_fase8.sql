-- PedidosGo — verificación rápida Fase 8
SELECT proname
FROM pg_proc
WHERE proname IN (
  'set_order_delivery_location',
  'set_branch_location',
  'get_order_map_points'
)
ORDER BY 1;

SELECT id, name,
  extensions.ST_Y(location::extensions.geometry) AS lat,
  extensions.ST_X(location::extensions.geometry) AS lng
FROM public.branches
WHERE id = 'b1000000-0000-4000-8000-000000000001';
