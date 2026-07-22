-- PedidosGo — verificación rápida Fase 6
SELECT proname
FROM pg_proc
WHERE proname IN (
  'bootstrap_my_merchant',
  'link_demo_merchant_el_pollon',
  'link_merchant_user_by_email',
  'list_my_merchant_members',
  'get_my_merchant_ids'
)
ORDER BY 1;

SELECT polname
FROM pg_policy
WHERE polrelid = 'public.merchants'::regclass
  AND polname = 'merchants_owner_update';
