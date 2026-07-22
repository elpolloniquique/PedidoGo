-- PedidosGo Fase 2: comercios y sucursales

CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.merchant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.merchant_user_role NOT NULL DEFAULT 'operator',
  branch_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (merchant_id, user_id)
);

CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  commune TEXT NOT NULL,
  region TEXT,
  postal_code TEXT,
  location extensions.geography (POINT, 4326),
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.merchant_users
  ADD CONSTRAINT merchant_users_branch_id_fkey
  FOREIGN KEY (branch_id) REFERENCES public.branches (id) ON DELETE SET NULL;

CREATE TABLE public.branch_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL UNIQUE REFERENCES public.branches (id) ON DELETE CASCADE,
  delivery_dispatch_mode public.delivery_dispatch_mode NOT NULL DEFAULT 'manual',
  auto_selection_strategy public.auto_selection_strategy NOT NULL DEFAULT 'balanced_score',
  default_search_radius_km NUMERIC(6, 2) NOT NULL DEFAULT 5,
  offer_timeout_seconds INTEGER NOT NULL DEFAULT 120,
  allow_driver_offers BOOLEAN NOT NULL DEFAULT TRUE,
  allow_fixed_fare BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.branch_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches (id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at TIME NOT NULL,
  closes_at TIME NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (branch_id, day_of_week)
);

CREATE TABLE public.service_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zone extensions.geography (POLYGON, 4326) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.merchant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants (id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.merchant_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants (id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches (id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret_hash TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_branches_merchant_id ON public.branches (merchant_id);
CREATE INDEX idx_branches_location ON public.branches USING GIST (location);
CREATE INDEX idx_service_zones_branch_id ON public.service_zones (branch_id);
CREATE INDEX idx_service_zones_zone ON public.service_zones USING GIST (zone);
CREATE INDEX idx_merchant_users_merchant_id ON public.merchant_users (merchant_id);
CREATE INDEX idx_merchant_users_user_id ON public.merchant_users (user_id);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_webhooks ENABLE ROW LEVEL SECURITY;
