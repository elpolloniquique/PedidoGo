-- PedidosGo — verificación rápida Fase 19
SELECT proname
FROM pg_proc
WHERE proname IN (
  'get_admin_dashboard_metrics',
  'get_merchant_dashboard_metrics',
  'claim_pending_webhook_deliveries'
)
ORDER BY 1;
