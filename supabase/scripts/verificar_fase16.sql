-- PedidosGo — verificación rápida Fase 16 (cierre)
-- No hay objetos nuevos de Fase 16; confirma que el stack de producción está presente.

SELECT 'migrations_applied_hint' AS check_name,
       COUNT(*)::TEXT AS detail
FROM pg_proc
WHERE proname IN (
  'get_public_tracking',
  'get_platform_health',
  'submit_driver_rating',
  'get_my_unread_notification_count',
  'apply_delivery_commission'
);

SELECT key, enabled
FROM public.feature_flags
WHERE key IN ('public_tracking', 'driver_offers', 'pwa_install_prompt')
ORDER BY 1;

SELECT COUNT(*) AS security_definer_rpcs
FROM pg_proc
WHERE prosecdef = TRUE
  AND pronamespace = 'public'::regnamespace;
