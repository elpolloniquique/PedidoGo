-- PedidosGo Fase 2: repartidores

CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  rut TEXT,
  birth_date DATE,
  region TEXT,
  city TEXT,
  commune TEXT,
  address_line TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  profile_image_url TEXT,
  status public.driver_application_status NOT NULL DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles (id),
  average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  completed_deliveries INTEGER NOT NULL DEFAULT 0,
  cancellation_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  status public.driver_application_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles (id),
  reviewer_notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status public.document_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles (id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  vehicle_type public.vehicle_type NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  license_plate TEXT,
  capacity TEXT,
  front_image_url TEXT,
  side_image_url TEXT,
  rear_image_url TEXT,
  plate_image_url TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  device_fingerprint TEXT,
  platform TEXT,
  is_pwa_installed BOOLEAN NOT NULL DEFAULT FALSE,
  last_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL UNIQUE REFERENCES public.drivers (id) ON DELETE CASCADE,
  status public.driver_availability_status NOT NULL DEFAULT 'offline',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  previous_status public.driver_availability_status,
  new_status public.driver_availability_status NOT NULL,
  changed_by UUID REFERENCES public.profiles (id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  order_id UUID,
  rated_by UUID REFERENCES public.profiles (id),
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.driver_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers (id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  suspended_by UUID REFERENCES public.profiles (id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id ON public.drivers (user_id);
CREATE INDEX idx_drivers_status ON public.drivers (status);
CREATE INDEX idx_driver_applications_driver_id ON public.driver_applications (driver_id);
CREATE INDEX idx_driver_documents_driver_id ON public.driver_documents (driver_id);
CREATE INDEX idx_driver_vehicles_driver_id ON public.driver_vehicles (driver_id);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_suspensions ENABLE ROW LEVEL SECURITY;
