-- PedidosGo Fase 2: ubicaciones, finanzas y comunicación

CREATE TABLE public.driver_current_locations (
  driver_id UUID PRIMARY KEY REFERENCES public.drivers (id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders (id) ON DELETE SET NULL,
  location extensions.geography (POINT, 4326) NOT NULL,
  accuracy_meters NUMERIC(8, 2),
  speed_mps NUMERIC(8, 2),
  heading_degrees NUMERIC(6, 2),
  altitude_meters NUMERIC(8, 2),
  device_id UUID,
  connection_status TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders (id) ON DELETE SET NULL,
  location extensions.geography (POINT, 4326) NOT NULL,
  accuracy_meters NUMERIC(8, 2),
  speed_mps NUMERIC(8, 2),
  heading_degrees NUMERIC(6, 2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.route_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests (id) ON DELETE CASCADE,
  route_geometry JSONB NOT NULL,
  distance_meters NUMERIC(12, 2),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.geofence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests (id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  geofence_type TEXT NOT NULL,
  distance_meters NUMERIC(8, 2),
  location extensions.geography (POINT, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL UNIQUE REFERENCES public.drivers (id) ON DELETE CASCADE,
  total_earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_pending NUMERIC(12, 2) NOT NULL DEFAULT 0,
  current_debt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.driver_wallets (id) ON DELETE CASCADE,
  transaction_type public.wallet_transaction_type NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2),
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  created_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  percentage NUMERIC(6, 4) NOT NULL DEFAULT 0.005,
  minimum_commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
  maximum_commission NUMERIC(12, 2),
  grace_debt_limit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  suspension_debt_limit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests (id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  delivery_amount NUMERIC(12, 2) NOT NULL,
  commission_amount NUMERIC(12, 2) NOT NULL,
  driver_net_amount NUMERIC(12, 2) NOT NULL,
  rule_id UUID REFERENCES public.commission_rules (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  proof_storage_path TEXT,
  reviewed_by UUID REFERENCES public.profiles (id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_by UUID REFERENCES public.profiles (id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'info',
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  vibration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_to UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets (id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles (id),
  message TEXT NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles (id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES public.profiles (id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE public.system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_driver_current_locations_location ON public.driver_current_locations USING GIST (location);
CREATE INDEX idx_driver_location_history_driver_id ON public.driver_location_history (driver_id, recorded_at DESC);
CREATE INDEX idx_notifications_user_id ON public.notifications (user_id, is_read);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_app_settings_key ON public.app_settings (key);

ALTER TABLE public.driver_current_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
