-- PedidosGo — verificación rápida Fase 17
SELECT proname
FROM pg_proc
WHERE proname IN (
  'register_delivery_evidence',
  'list_delivery_evidence',
  'count_delivery_evidence'
)
ORDER BY 1;

SELECT key, enabled
FROM public.feature_flags
WHERE key = 'require_delivery_evidence';

SELECT polname
FROM pg_policy
WHERE polrelid = 'public.delivery_evidence'::regclass
ORDER BY 1;
