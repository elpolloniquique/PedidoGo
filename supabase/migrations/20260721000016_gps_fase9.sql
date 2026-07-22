-- PedidosGo Fase 9: GPS del repartidor, disponibilidad y geocercas

-- RLS lectura de geofence_events
DROP POLICY IF EXISTS geofence_events_select ON public.geofence_events;
CREATE POLICY geofence_events_select ON public.geofence_events
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
    OR EXISTS (
      SELECT 1
      FROM public.delivery_requests dr
      WHERE dr.id = delivery_request_id
        AND public.user_belongs_to_branch(dr.branch_id)
    )
  );

DROP POLICY IF EXISTS route_snapshots_select ON public.route_snapshots;
CREATE POLICY route_snapshots_select ON public.route_snapshots
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.delivery_requests dr
      LEFT JOIN public.delivery_assignments da ON da.delivery_request_id = dr.id
      WHERE dr.id = delivery_request_id
        AND (
          public.user_belongs_to_branch(dr.branch_id)
          OR da.driver_id = public.get_my_driver_id()
        )
    )
  );

-- Upsert ubicación actual + historial
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
    driver_id, order_id, location, accuracy_meters, speed_mps, heading_degrees,
    connection_status, recorded_at, updated_at
  ) VALUES (
    v_driver_id, p_order_id, v_point, p_accuracy_meters, p_speed_mps, p_heading_degrees,
    'online', NOW(), NOW()
  )
  ON CONFLICT (driver_id) DO UPDATE
    SET order_id = COALESCE(EXCLUDED.order_id, public.driver_current_locations.order_id),
        location = EXCLUDED.location,
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

CREATE OR REPLACE FUNCTION public.set_my_availability(
  p_status public.driver_availability_status
)
RETURNS public.driver_availability_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_prev public.driver_availability_status;
BEGIN
  v_driver_id := public.get_my_driver_id();
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'No eres repartidor';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.drivers d WHERE d.id = v_driver_id AND d.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Solo repartidores aprobados';
  END IF;

  -- El driver solo puede ponerse available u offline (busy lo pone el sistema)
  IF p_status NOT IN ('available', 'offline') THEN
    RAISE EXCEPTION 'Estado no permitido: usa available u offline';
  END IF;

  -- Si tiene entrega activa, no puede pasar a available (queda busy)
  IF p_status = 'available' AND EXISTS (
    SELECT 1
    FROM public.delivery_assignments da
    JOIN public.delivery_requests dr ON dr.id = da.delivery_request_id
    WHERE da.driver_id = v_driver_id
      AND dr.status NOT IN ('delivered', 'cancelled', 'returned', 'failed_delivery')
  ) THEN
    RAISE EXCEPTION 'Tienes una entrega activa; termina el pedido antes de ponerte disponible';
  END IF;

  SELECT status INTO v_prev FROM public.driver_availability WHERE driver_id = v_driver_id;

  INSERT INTO public.driver_availability (driver_id, status, changed_at, updated_at)
  VALUES (v_driver_id, p_status, NOW(), NOW())
  ON CONFLICT (driver_id) DO UPDATE
    SET status = EXCLUDED.status,
        changed_at = NOW(),
        updated_at = NOW();

  INSERT INTO public.driver_status_history (
    driver_id, previous_status, new_status, changed_by, metadata
  ) VALUES (
    v_driver_id, v_prev, p_status, auth.uid(), '{}'::jsonb
  );

  RETURN p_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_availability()
RETURNS TABLE (
  status public.driver_availability_status,
  changed_at TIMESTAMPTZ,
  has_location BOOLEAN,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location_recorded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  v_driver_id := public.get_my_driver_id();
  IF v_driver_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(da.status, 'offline'::public.driver_availability_status),
    da.changed_at,
    dcl.location IS NOT NULL,
    ST_Y(dcl.location::geometry),
    ST_X(dcl.location::geometry),
    dcl.recorded_at
  FROM public.drivers d
  LEFT JOIN public.driver_availability da ON da.driver_id = d.id
  LEFT JOIN public.driver_current_locations dcl ON dcl.driver_id = d.id
  WHERE d.id = v_driver_id;
END;
$$;

-- Geocerca: verifica, registra evento y retorna detalle
CREATE OR REPLACE FUNCTION public.check_geofence_for_delivery(
  p_delivery_request_id UUID,
  p_geofence_type TEXT,
  p_radius_meters NUMERIC DEFAULT 200,
  p_record_event BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  inside BOOLEAN,
  distance_meters NUMERIC,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_driver_id UUID;
  v_target extensions.geography;
  v_loc extensions.geography;
  v_dist NUMERIC;
  v_inside BOOLEAN;
BEGIN
  v_driver_id := public.get_my_driver_id();
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'No eres repartidor';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.delivery_assignments da
    WHERE da.delivery_request_id = p_delivery_request_id
      AND da.driver_id = v_driver_id
  ) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sin asignación a esta entrega';
  END IF;

  SELECT dcl.location INTO v_loc
  FROM public.driver_current_locations dcl
  WHERE dcl.driver_id = v_driver_id;

  IF v_loc IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::NUMERIC, NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION;
    RETURN;
  END IF;

  IF p_geofence_type = 'pickup' THEN
    SELECT b.location INTO v_target
    FROM public.delivery_requests dr
    JOIN public.branches b ON b.id = dr.branch_id
    WHERE dr.id = p_delivery_request_id;
  ELSIF p_geofence_type = 'delivery' THEN
    SELECT o.delivery_location INTO v_target
    FROM public.delivery_requests dr
    JOIN public.orders o ON o.id = dr.order_id
    WHERE dr.id = p_delivery_request_id;
  ELSE
    RAISE EXCEPTION 'geofence_type inválido (pickup|delivery)';
  END IF;

  IF v_target IS NULL THEN
    -- Sin punto objetivo: no bloquear (modo permisivo)
    RETURN QUERY SELECT TRUE, NULL::NUMERIC, ST_Y(v_loc::geometry), ST_X(v_loc::geometry);
    RETURN;
  END IF;

  v_dist := ST_Distance(v_loc, v_target);
  v_inside := ST_DWithin(v_loc, v_target, p_radius_meters);

  IF p_record_event AND v_inside THEN
    INSERT INTO public.geofence_events (
      delivery_request_id, driver_id, geofence_type, distance_meters, location
    ) VALUES (
      p_delivery_request_id, v_driver_id, p_geofence_type, v_dist, v_loc
    );
  END IF;

  RETURN QUERY SELECT v_inside, v_dist, ST_Y(v_loc::geometry), ST_X(v_loc::geometry);
END;
$$;

-- Ubicación del driver asignado (para el comercio)
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
    ST_Y(dcl.location::geometry),
    ST_X(dcl.location::geometry),
    dcl.accuracy_meters,
    dcl.recorded_at,
    dcl.heading_degrees,
    dcl.speed_mps
  FROM public.driver_current_locations dcl
  WHERE dcl.driver_id = v_driver_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_my_location(
  DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, UUID, BOOLEAN
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_availability(public.driver_availability_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_availability() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_geofence_for_delivery(UUID, TEXT, NUMERIC, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_driver_location(UUID) TO authenticated;
