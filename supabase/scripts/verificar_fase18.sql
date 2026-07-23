-- PedidosGo — verificación rápida Fase 18
SELECT proname
FROM pg_proc
WHERE proname IN (
  'create_merchant_webhook',
  'list_merchant_webhooks',
  'claim_pending_webhook_deliveries',
  'create_support_ticket',
  'list_support_tickets',
  'get_support_ticket_thread'
)
ORDER BY 1;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'merchant_webhooks'
  AND column_name = 'secret';

SELECT tgname
FROM pg_trigger
WHERE tgname = 'trg_order_status_webhook';
