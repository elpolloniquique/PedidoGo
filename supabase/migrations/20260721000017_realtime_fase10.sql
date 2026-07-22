-- PedidosGo Fase 10: Supabase Realtime (ofertas, estados, GPS)

-- Coordenadas planas para payload Realtime (geography no es cómodo en el cliente)
ALTER TABLE public.driver_current_locations
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

UPDATE public.driver_current_locations
SET
  lat = extensions.ST_Y(location::extensions.geometry),
  lng = extensions.ST_X(location::extensions.geometry)
WHERE location IS NOT NULL
  AND (lat IS NULL OR lng IS NULL);

-- Actualizar upsert GPS para rellenar lat/lng
CREATE OR REPLACE FUNCTION public.upsert_my_location(
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION,
  p_accuracy_meters NUMERIC DEFAULT NULL,
  p_speed_mps NUMERIC DEFAULT NULL,
  p_heading_degrees NUMERIC DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_write_history BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_driver_id UUID;
  v_point extensions.geography;
BEGIN
  v_driver_id := public.get_my_driver_id();
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'No eres repartidor';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.drivers d WHERE d.id = v_driver_id AND d.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Solo repartidores aprobados pueden enviar GPS';
  END IF;

  IF p_lat IS NULL OR p_lng IS NULL
     OR p_lat < -90 OR p_lat > 90
     OR p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'Coordenadas inválidas';
  END IF;

  v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography;

  INSERT INTO public.driver_current_locations (
    driver_id, order_id, location, lat, lng,
    accuracy_meters, speed_mps, heading_degrees,
    connection_status, recorded_at, updated_at
  ) VALUES (
    v_driver_id, p_order_id, v_point, p_lat, p_lng,
    p_accuracy_meters, p_speed_mps, p_heading_degrees,
    'online', NOW(), NOW()
  )
  ON CONFLICT (driver_id) DO UPDATE
    SET order_id = COALESCE(EXCLUDED.order_id, public.driver_current_locations.order_id),
        location = EXCLUDED.location,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        accuracy_meters = EXCLUDED.accuracy_meters,
        speed_mps = EXCLUDED.speed_mps,
        heading_degrees = EXCLUDED.heading_degrees,
        connection_status = 'online',
        recorded_at = NOW(),
        updated_at = NOW();

  IF p_write_history THEN
    INSERT INTO public.driver_location_history (
      driver_id, order_id, location, accuracy_meters, speed_mps, heading_degrees, recorded_at
    ) VALUES (
      v_driver_id, p_order_id, v_point, p_accuracy_meters, p_speed_mps, p_heading_degrees, NOW()
    );
  END IF;
END;
$$;

-- Replica identity FULL: filtros Realtime y payload completo en UPDATE
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_requests REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_offers REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.driver_current_locations REPLICA IDENTITY FULL;

-- Publicar tablas en Realtime (idempotente)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_offers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_current_locations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Preferir columnas lat/lng en RPC de lectura
CREATE OR REPLACE FUNCTION public.get_order_driver_location(p_order_id UUID)
RETURNS TABLE (
  driver_id UUID,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  accuracy_meters NUMERIC,
  recorded_at TIMESTAMPTZ,
  heading_degrees NUMERIC,
  speed_mps NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_branch_id UUID;
  v_driver_id UUID;
BEGIN
  SELECT o.branch_id, da.driver_id
  INTO v_branch_id, v_driver_id
  FROM public.orders o
  JOIN public.delivery_requests dr ON dr.order_id = o.id
  LEFT JOIN public.delivery_assignments da ON da.delivery_request_id = dr.id
  WHERE o.id = p_order_id;

  IF v_branch_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT (
    public.is_admin()
    OR public.user_belongs_to_branch(v_branch_id)
    OR v_driver_id = public.get_my_driver_id()
  ) THEN
    RETURN;
  END IF;

  IF v_driver_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    dcl.driver_id,
    COALESCE(dcl.lat, ST_Y(dcl.location::geometry)),
    COALESCE(dcl.lng, ST_X(dcl.location::geometry)),
    dcl.accuracy_meters,
    dcl.recorded_at,
    dcl.heading_degrees,
    dcl.speed_mps
  FROM public.driver_current_locations dcl
  WHERE dcl.driver_id = v_driver_id;
END;
$$;
