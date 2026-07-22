-- PedidosGo Fase 2: clientes, pedidos y delivery

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  label TEXT,
  address_line TEXT NOT NULL,
  commune TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  apartment TEXT,
  references_text TEXT,
  location extensions.geography (POINT, 4326),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants (id),
  branch_id UUID NOT NULL REFERENCES public.branches (id),
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_commune TEXT,
  delivery_city TEXT,
  delivery_apartment TEXT,
  delivery_references TEXT,
  delivery_location extensions.geography (POINT, 4326),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  amount_to_collect NUMERIC(12, 2) NOT NULL DEFAULT 0,
  change_required NUMERIC(12, 2) NOT NULL DEFAULT 0,
  preparation_time_minutes INTEGER,
  status public.order_status NOT NULL DEFAULT 'pending',
  dispatch_mode_override public.dispatch_mode_override NOT NULL DEFAULT 'inherit',
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  previous_status public.order_status,
  new_status public.order_status NOT NULL,
  changed_by UUID REFERENCES public.profiles (id),
  comment TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles (id),
  note TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method public.payment_method NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches (id),
  status public.delivery_status NOT NULL DEFAULT 'created',
  dispatch_mode public.delivery_dispatch_mode NOT NULL DEFAULT 'manual',
  fixed_fare NUMERIC(12, 2),
  search_radius_km NUMERIC(6, 2) NOT NULL DEFAULT 5,
  offer_deadline_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.delivery_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests (id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  offered_price NUMERIC(12, 2) NOT NULL,
  estimated_minutes INTEGER,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (delivery_request_id, driver_id)
);

CREATE TABLE public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL UNIQUE REFERENCES public.delivery_requests (id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers (id),
  offer_id UUID REFERENCES public.delivery_offers (id),
  assigned_by UUID REFERENCES public.profiles (id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pickup_code TEXT,
  delivery_pin TEXT,
  tracking_token TEXT UNIQUE,
  tracking_token_expires_at TIMESTAMPTZ
);

CREATE TABLE public.delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests (id) ON DELETE CASCADE,
  previous_status public.delivery_status,
  new_status public.delivery_status NOT NULL,
  actor_id UUID REFERENCES public.profiles (id),
  location extensions.geography (POINT, 4326),
  comment TEXT,
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.delivery_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests (id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  captured_by UUID REFERENCES public.profiles (id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.delivery_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests (id) ON DELETE CASCADE,
  reported_by UUID REFERENCES public.profiles (id),
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.driver_ratings
  ADD CONSTRAINT driver_ratings_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE SET NULL;

CREATE INDEX idx_orders_merchant_id ON public.orders (merchant_id);
CREATE INDEX idx_orders_branch_id ON public.orders (branch_id);
CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX idx_delivery_requests_branch_id ON public.delivery_requests (branch_id);
CREATE INDEX idx_delivery_requests_status ON public.delivery_requests (status);
CREATE INDEX idx_delivery_offers_request_id ON public.delivery_offers (delivery_request_id);
CREATE INDEX idx_delivery_assignments_driver_id ON public.delivery_assignments (driver_id);
CREATE INDEX idx_customer_addresses_location ON public.customer_addresses USING GIST (location);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_incidents ENABLE ROW LEVEL SECURITY;
