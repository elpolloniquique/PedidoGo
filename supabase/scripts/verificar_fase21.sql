-- PedidosGo — verificación rápida Fase 21
SELECT proname
FROM pg_proc
WHERE proname IN (
  'create_merchant_api_key',
  'list_merchant_api_keys',
  'revoke_merchant_api_key',
  'resolve_merchant_api_key',
  'get_my_notification_preferences',
  'set_my_notification_preferences',
  'export_admin_orders_report',
  'export_admin_drivers_report',
  'export_admin_payments_report'
)
ORDER BY 1;
