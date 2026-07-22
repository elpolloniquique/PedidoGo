-- PedidosGo Fase 2: funciones RPC PostGIS seguras

CREATE OR REPLACE FUNCTION public.find_nearby_available_drivers(
  p_branch_id UUID,
  p_radius_km NUMERIC DEFAULT 5,
  p_vehicle_type public.vehicle_type DEFAULT NULL
)
RETURNS TABLE (
  driver_id UUID,
  distance_meters NUMERIC,
  availability_status public.driver_availability_status,
  average_rating NUMERIC,
  recorded_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    d.id AS driver_id,
    ST_Distance(
      b.location,
      dcl.location
    )::NUMERIC AS distance_meters,
    da.status AS availability_status,
    d.average_rating,
    dcl.recorded_at
  FROM public.branches b
  JOIN public.driver_current_locations dcl ON TRUE
  JOIN public.drivers d ON d.id = dcl.driver_id
  JOIN public.driver_availability da ON da.driver_id = d.id
  LEFT JOIN public.driver_vehicles dv ON dv.driver_id = d.id AND dv.is_primary = TRUE
  WHERE b.id = p_branch_id
    AND public.user_belongs_to_branch(p_branch_id)
    AND d.status = 'approved'
    AND da.status = 'available'
    AND dcl.recorded_at >= NOW() - INTERVAL '10 minutes'
    AND ST_DWithin(
      b.location,
      dcl.location,
      p_radius_km * 1000
    )
    AND (p_vehicle_type IS NULL OR dv.vehicle_type = p_vehicle_type)
  ORDER BY distance_meters ASC;
$$;

CREATE OR REPLACE FUNCTION public.calculate_driver_distance(
  p_driver_id UUID,
  p_target_location extensions.geography
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT ST_Distance(dcl.location, p_target_location)::NUMERIC
  FROM public.driver_current_locations dcl
  WHERE dcl.driver_id = p_driver_id
    AND (
      public.is_admin()
      OR p_driver_id = public.get_my_driver_id()
      OR EXISTS (
        SELECT 1
        FROM public.delivery_assignments da
        JOIN public.delivery_requests dr ON dr.id = da.delivery_request_id
        JOIN public.orders o ON o.id = dr.order_id
        WHERE da.driver_id = p_driver_id
          AND public.user_belongs_to_merchant(o.merchant_id)
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.check_driver_inside_pickup_geofence(
  p_delivery_request_id UUID,
  p_radius_meters NUMERIC DEFAULT 200
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.delivery_requests dr
    JOIN public.branches b ON b.id = dr.branch_id
    JOIN public.driver_current_locations dcl ON dcl.driver_id = public.get_my_driver_id()
    WHERE dr.id = p_delivery_request_id
      AND ST_DWithin(b.location, dcl.location, p_radius_meters)
  );
$$;

CREATE OR REPLACE FUNCTION public.check_driver_inside_delivery_geofence(
  p_delivery_request_id UUID,
  p_radius_meters NUMERIC DEFAULT 200
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.delivery_requests dr
    JOIN public.orders o ON o.id = dr.order_id
    JOIN public.driver_current_locations dcl ON dcl.driver_id = public.get_my_driver_id()
    WHERE dr.id = p_delivery_request_id
      AND o.delivery_location IS NOT NULL
      AND ST_DWithin(o.delivery_location, dcl.location, p_radius_meters)
  );
$$;

CREATE OR REPLACE FUNCTION public.find_branch_service_zone(
  p_branch_id UUID,
  p_location extensions.geography
)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT sz.id
  FROM public.service_zones sz
  WHERE sz.branch_id = p_branch_id
    AND sz.is_active = TRUE
    AND ST_Covers(sz.zone, p_location)
  ORDER BY sz.created_at ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_nearby_available_drivers(UUID, NUMERIC, public.vehicle_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_driver_distance(UUID, extensions.geography) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_driver_inside_pickup_geofence(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_driver_inside_delivery_geofence(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_branch_service_zone(UUID, extensions.geography) TO authenticated;
