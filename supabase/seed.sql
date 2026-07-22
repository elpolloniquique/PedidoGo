-- PedidosGo seed — Fase 2
-- Ejecutar después de aplicar todas las migraciones

-- Roles del sistema
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

-- Permisos base
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

-- Permisos por rol (muestra representativa)
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

-- Marca PedidosGo (también disponible vía env en frontend)
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

-- Regla de comisión MVP: 0.5%
INSERT INTO public.commission_rules (
  name,
  percentage,
  minimum_commission,
  maximum_commission,
  grace_debt_limit,
  suspension_debt_limit,
  is_active
)
SELECT
  'Comisión estándar PedidosGo',
  0.005,
  0,
  NULL,
  50000,
  100000,
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_rules WHERE name = 'Comisión estándar PedidosGo'
);

-- Feature flags iniciales
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

-- Comercio semilla: Pollería El Pollón
INSERT INTO public.merchants (
  id,
  name,
  legal_name,
  email,
  phone,
  website_url,
  is_active,
  is_approved,
  approved_at
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
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branches (
  id,
  merchant_id,
  name,
  code,
  address_line,
  city,
  commune,
  region,
  location,
  phone,
  is_active
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
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branch_settings (
  branch_id,
  delivery_dispatch_mode,
  auto_selection_strategy,
  default_search_radius_km,
  offer_timeout_seconds,
  allow_driver_offers,
  allow_fixed_fare
) VALUES (
  'b1000000-0000-4000-8000-000000000001',
  'manual',
  'balanced_score',
  5,
  120,
  TRUE,
  TRUE
)
ON CONFLICT (branch_id) DO NOTHING;

-- Horario ejemplo (Lunes a Domingo 10:00 - 22:00)
INSERT INTO public.branch_hours (branch_id, day_of_week, opens_at, closes_at, is_closed)
SELECT
  'b1000000-0000-4000-8000-000000000001',
  d,
  TIME '10:00',
  TIME '22:00',
  FALSE
FROM generate_series(0, 6) AS d
ON CONFLICT (branch_id, day_of_week) DO NOTHING;
