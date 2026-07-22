-- PedidosGo — verificación rápida Fase 14
SELECT proname
FROM pg_proc
WHERE proname IN (
  'assert_rate_limit',
  'prune_rpc_rate_limits',
  'report_client_error',
  'get_platform_health'
)
ORDER BY 1;

SELECT to_regclass('public.rpc_rate_limits') IS NOT NULL AS has_rate_limits_table;

-- Smoke rate limit (no debe fallar)
SELECT public.assert_rate_limit('verificar_fase14_test', 5, 60);
