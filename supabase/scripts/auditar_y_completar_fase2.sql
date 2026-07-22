-- ============================================================
-- PedidosGo — Auditoría completa Fase 2
-- Ejecutar TODO este script en SQL Editor (rol postgres)
-- Luego revisa la tabla de resultados del último SELECT
-- ============================================================

-- A) Completar seed de forma idempotente (seguro re-ejecutar)
INSERT INTO public.roles (slug, name, description) VALUES
  ('super_admin', 'Superadministrador', 'Control total de la plataforma'),
  ('platform_admin', 'Administrador de plataforma', 'Administración operativa global'),
  ('merchant_owner', 'Dueño de comercio', 'Propietario del comercio'),
  ('merchant_admin', 'Administrador de comercio', 'Administración del comercio y sucursales'),
  ('merchant_operator', 'Operador de comercio', 'Operación diaria de pedidos'),
  ('driver', 'Repartidor', 'Repartidor independiente'),
  ('customer', 'Cliente', 'Cliente final'),
  ('support_agent', 'Agente de soporte', 'Soporte interno')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.permissions (slug, name, description) VALUES
  ('platform.manage', 'Gestionar plataforma', 'Configuración global'),
  ('drivers.approve', 'Aprobar repartidores', 'Revisar y aprobar solicitudes'),
  ('merchants.manage', 'Gestionar comercios', 'CRUD de comercios'),
  ('orders.read', 'Ver pedidos', 'Lectura de pedidos'),
  ('orders.write', 'Gestionar pedidos', 'Crear y actualizar pedidos'),
  ('delivery.dispatch', 'Despachar delivery', 'Publicar y asignar repartidores'),
  ('delivery.deliver', 'Entregar pedidos', 'Flujo del repartidor'),
  ('finance.read', 'Ver finanzas', 'Ver comisiones y pagos'),
  ('finance.manage', 'Gestionar finanzas', 'Aprobar pagos y ajustes'),
  ('support.manage', 'Gestionar soporte', 'Tickets de soporte')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.slug IN ('orders.read', 'orders.write', 'delivery.dispatch')
WHERE r.slug IN ('merchant_owner', 'merchant_admin', 'merchant_operator')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.slug IN ('delivery.deliver', 'finance.read')
WHERE r.slug = 'driver'
ON CONFLICT DO NOTHING;

INSERT INTO public.app_settings (key, value, description, is_public) VALUES
  ('app_name', 'PedidosGo', 'Nombre de la aplicación', TRUE),
  ('app_short_name', 'PedidosGo', 'Nombre corto', TRUE),
  ('app_description', 'Plataforma inteligente de delivery para comercios y repartidores', 'Descripción', TRUE),
  ('app_logo_url', '', 'URL del logotipo', TRUE),
  ('app_primary_color', '#0F766E', 'Color primario', TRUE),
  ('app_secondary_color', '#134E4A', 'Color secundario', TRUE),
  ('app_support_email', 'soporte@pedidosgo.cl', 'Correo de soporte', TRUE),
  ('app_support_phone', '', 'Teléfono de soporte', TRUE),
  ('app_domain', 'pedidosgo.cl', 'Dominio principal', TRUE),
  ('commission_percentage', '0.005', 'Comisión plataforma (0.5%)', FALSE),
  ('minimum_commission', '0', 'Comisión mínima CLP', FALSE),
  ('grace_debt_limit', '50000', 'Límite de deuda con gracia CLP', FALSE),
  ('suspension_debt_limit', '100000', 'Límite de suspensión por deuda CLP', FALSE)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      is_public = EXCLUDED.is_public,
      updated_at = NOW();

INSERT INTO public.commission_rules (
  name, percentage, minimum_commission, maximum_commission,
  grace_debt_limit, suspension_debt_limit, is_active
)
SELECT
  'Comisión estándar PedidosGo', 0.005, 0, NULL, 50000, 100000, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_rules WHERE name = 'Comisión estándar PedidosGo'
);

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('pwa_install_prompt', TRUE, 'Mostrar aviso de instalación PWA a repartidores aprobados'),
  ('driver_offers', TRUE, 'Permitir ofertas de repartidores'),
  ('fixed_fare', TRUE, 'Permitir tarifa fija'),
  ('auto_dispatch', TRUE, 'Despacho automático de pedidos'),
  ('public_tracking', FALSE, 'Seguimiento público del cliente (Fase 12)')
ON CONFLICT (key) DO UPDATE
  SET enabled = EXCLUDED.enabled,
      description = EXCLUDED.description,
      updated_at = NOW();

INSERT INTO public.merchants (
  id, name, legal_name, email, phone, website_url,
  is_active, is_approved, approved_at
) VALUES (
  'a1000000-0000-4000-8000-000000000001',
  'Pollería El Pollón',
  'Pollería El Pollón SpA',
  'contacto@elpollon.cl',
  NULL,
  NULL,
  TRUE,
  TRUE,
  NOW()
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      legal_name = EXCLUDED.legal_name,
      is_active = TRUE,
      is_approved = TRUE,
      updated_at = NOW();

INSERT INTO public.branches (
  id, merchant_id, name, code, address_line, city, commune, region,
  location, phone, is_active
) VALUES (
  'b1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'El Pollón — Sucursal principal',
  'POLLON-01',
  'Dirección por configurar',
  'Santiago',
  'Santiago',
  'Región Metropolitana',
  extensions.ST_GeogFromText('SRID=4326;POINT(-70.6483 -33.4489)'),
  NULL,
  TRUE
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      location = EXCLUDED.location,
      is_active = TRUE,
      updated_at = NOW();

INSERT INTO public.branch_settings (
  branch_id, delivery_dispatch_mode, auto_selection_strategy,
  default_search_radius_km, offer_timeout_seconds,
  allow_driver_offers, allow_fixed_fare
) VALUES (
  'b1000000-0000-4000-8000-000000000001',
  'manual', 'balanced_score', 5, 120, TRUE, TRUE
)
ON CONFLICT (branch_id) DO NOTHING;

INSERT INTO public.branch_hours (branch_id, day_of_week, opens_at, closes_at, is_closed)
SELECT
  'b1000000-0000-4000-8000-000000000001',
  d,
  TIME '10:00',
  TIME '22:00',
  FALSE
FROM generate_series(0, 6) AS d
ON CONFLICT (branch_id, day_of_week) DO NOTHING;

-- B) Informe de salud (una sola tabla)
SELECT * FROM (
  SELECT 1 AS orden, 'postgis' AS chequeo,
         CASE WHEN PostGIS_Version() IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS estado,
         COALESCE(PostGIS_Version(), 'sin version') AS detalle
  UNION ALL
  SELECT 2, 'tabla_app_settings',
         CASE WHEN to_regclass('public.app_settings') IS NOT NULL THEN 'OK' ELSE 'FAIL' END,
         COALESCE(to_regclass('public.app_settings')::text, 'null')
  UNION ALL
  SELECT 3, 'tabla_roles',
         CASE WHEN to_regclass('public.roles') IS NOT NULL THEN 'OK' ELSE 'FAIL' END,
         COALESCE(to_regclass('public.roles')::text, 'null')
  UNION ALL
  SELECT 4, 'tabla_merchants',
         CASE WHEN to_regclass('public.merchants') IS NOT NULL THEN 'OK' ELSE 'FAIL' END,
         COALESCE(to_regclass('public.merchants')::text, 'null')
  UNION ALL
  SELECT 5, 'tabla_drivers',
         CASE WHEN to_regclass('public.drivers') IS NOT NULL THEN 'OK' ELSE 'FAIL' END,
         COALESCE(to_regclass('public.drivers')::text, 'null')
  UNION ALL
  SELECT 6, 'tabla_orders',
         CASE WHEN to_regclass('public.orders') IS NOT NULL THEN 'OK' ELSE 'FAIL' END,
         COALESCE(to_regclass('public.orders')::text, 'null')
  UNION ALL
  SELECT 7, 'roles_count',
         CASE WHEN (SELECT COUNT(*) FROM public.roles) >= 8 THEN 'OK' ELSE 'FAIL' END,
         (SELECT COUNT(*)::text FROM public.roles)
  UNION ALL
  SELECT 8, 'app_settings_public',
         CASE WHEN (SELECT COUNT(*) FROM public.app_settings WHERE is_public) >= 9 THEN 'OK' ELSE 'FAIL' END,
         (SELECT COUNT(*)::text FROM public.app_settings WHERE is_public)
  UNION ALL
  SELECT 9, 'merchant_el_pollon',
         CASE WHEN EXISTS (
           SELECT 1 FROM public.merchants WHERE name ILIKE '%Pollón%' OR name ILIKE '%Pollon%'
         ) THEN 'OK' ELSE 'FAIL' END,
         COALESCE((SELECT name FROM public.merchants LIMIT 1), 'sin comercios')
  UNION ALL
  SELECT 10, 'branch_principal',
         CASE WHEN EXISTS (
           SELECT 1 FROM public.branches WHERE id = 'b1000000-0000-4000-8000-000000000001'
         ) THEN 'OK' ELSE 'FAIL' END,
         COALESCE((
           SELECT name FROM public.branches WHERE id = 'b1000000-0000-4000-8000-000000000001'
         ), 'sin sucursal')
  UNION ALL
  SELECT 11, 'commission_rule',
         CASE WHEN EXISTS (SELECT 1 FROM public.commission_rules WHERE is_active) THEN 'OK' ELSE 'FAIL' END,
         COALESCE((SELECT percentage::text FROM public.commission_rules WHERE is_active LIMIT 1), '0')
  UNION ALL
  SELECT 12, 'fn_find_nearby_drivers',
         CASE WHEN to_regprocedure('public.find_nearby_available_drivers(uuid, numeric, public.vehicle_type)') IS NOT NULL
              OR EXISTS (
                SELECT 1 FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'public' AND p.proname = 'find_nearby_available_drivers'
              ) THEN 'OK' ELSE 'FAIL' END,
         'RPC PostGIS'
  UNION ALL
  SELECT 13, 'trigger_new_user',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
         ) THEN 'OK' ELSE 'FAIL' END,
         'auth.users -> profiles'
  UNION ALL
  SELECT 14, 'storage_buckets',
         CASE WHEN (
           SELECT COUNT(*) FROM storage.buckets
           WHERE id IN (
             'public-assets','merchant-logos','driver-profile-images',
             'driver-documents','vehicle-documents','delivery-evidence','support-attachments'
           )
         ) >= 7 THEN 'OK' ELSE 'FAIL' END,
         (SELECT COUNT(*)::text FROM storage.buckets)
) AS informe
ORDER BY orden;
