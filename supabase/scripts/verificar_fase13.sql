-- PedidosGo — verificación rápida Fase 13
SELECT proname
FROM pg_proc
WHERE proname IN (
  'create_in_app_notification',
  'notify_branch_users',
  'notify_driver_user',
  'mark_my_notification_read',
  'mark_all_my_notifications_read',
  'get_my_unread_notification_count',
  'submit_driver_rating',
  'get_order_rating'
)
ORDER BY 1;

-- notifications en Realtime
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';

-- triggers
SELECT tgname
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname LIKE 'trg_notify%'
ORDER BY 1;
