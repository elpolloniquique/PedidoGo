-- PedidosGo — verificación rápida Fase 12
SELECT proname
FROM pg_proc
WHERE proname = 'get_public_tracking'
ORDER BY 1;

SELECT key, enabled
FROM public.feature_flags
WHERE key = 'public_tracking';

-- Smoke: token inexistente → not_found
SELECT valid, error_code
FROM public.get_public_tracking('token_inexistente_fase12_test_xx');
