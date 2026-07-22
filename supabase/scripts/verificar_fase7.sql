-- PedidosGo — verificación rápida Fase 7
SELECT proname
FROM pg_proc
WHERE proname IN (
  'create_manual_order',
  'update_order_status',
  'publish_delivery_request',
  'submit_delivery_offer',
  'accept_delivery_offer',
  'advance_delivery_status',
  'list_open_delivery_jobs',
  'get_my_active_delivery'
)
ORDER BY 1;
