-- Verificación rápida Fase 3 (ejecutar en SQL Editor)
SELECT 'get_my_roles' AS fn, to_regprocedure('public.get_my_roles()') IS NOT NULL AS ok
UNION ALL
SELECT 'get_my_profile', to_regprocedure('public.get_my_profile()') IS NOT NULL
UNION ALL
SELECT 'handle_new_user', EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
);
