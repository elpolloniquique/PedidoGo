-- PedidosGo — verificación rápida Fase 20
SELECT proname
FROM pg_proc
WHERE proname IN (
  'list_audit_logs',
  'list_feature_flags',
  'set_feature_flag',
  'list_system_errors',
  'list_app_settings_admin',
  'set_app_setting'
)
ORDER BY 1;
