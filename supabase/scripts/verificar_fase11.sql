-- PedidosGo — verificación rápida Fase 11
SELECT proname
FROM pg_proc
WHERE proname IN (
  'apply_delivery_commission',
  'get_my_wallet',
  'submit_commission_payment',
  'review_commission_payment',
  'update_active_commission_percentage',
  'get_active_commission_rule'
)
ORDER BY 1;

SELECT percentage, is_active
FROM public.commission_rules
WHERE is_active = TRUE
LIMIT 1;
