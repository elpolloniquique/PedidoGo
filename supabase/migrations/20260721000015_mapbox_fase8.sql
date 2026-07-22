-- PedidosGo Fase 8: ubicaciones geográficas para Mapbox

CREATE OR REPLACE FUNCTION public.set_order_delivery_location(
  p_order_id UUID,
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  SELECT branch_id INTO v_branch_id FROM public.orders WHERE id = p_order_id;
  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF NOT (public.is_admin() OR public.user_belongs_to_branch(v_branch_id)) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;

  IF p_lng IS NULL OR p_lat IS NULL
     OR p_lat < -90 OR p_lat > 90
     OR p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'Coordenadas inválidas';
  END IF;

  UPDATE public.orders
  SET
    delivery_location = extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
    updated_at = NOW()
  WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_branch_location(
  p_branch_id UUID,
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.user_belongs_to_branch(p_branch_id)) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;

  IF p_lng IS NULL OR p_lat IS NULL
     OR p_lat < -90 OR p_lat > 90
     OR p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'Coordenadas inválidas';
  END IF;

  UPDATE public.branches
  SET
    location = extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
    updated_at = NOW()
  WHERE id = p_branch_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_map_points(p_order_id UUID)
RETURNS TABLE (
  delivery_lng DOUBLE PRECISION,
  delivery_lat DOUBLE PRECISION,
  branch_lng DOUBLE PRECISION,
  branch_lat DOUBLE PRECISION,
  branch_name TEXT,
  delivery_address TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_access_order(p_order_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    extensions.ST_X(o.delivery_location::extensions.geometry),
    extensions.ST_Y(o.delivery_location::extensions.geometry),
    extensions.ST_X(b.location::extensions.geometry),
    extensions.ST_Y(b.location::extensions.geometry),
    b.name,
    o.delivery_address
  FROM public.orders o
  JOIN public.branches b ON b.id = o.branch_id
  WHERE o.id = p_order_id;
END;
$$;

-- Ampliar marketplace con coordenadas
-- Hay que DROP porque cambió el RETURNS TABLE (Postgres no permite OR REPLACE con otro tipo de retorno)
DROP FUNCTION IF EXISTS public.list_open_delivery_jobs();
CREATE OR REPLACE FUNCTION public.list_open_delivery_jobs()
RETURNS TABLE (
  delivery_request_id UUID,
  order_id UUID,
  order_number TEXT,
  branch_name TEXT,
  merchant_name TEXT,
  delivery_commune TEXT,
  delivery_city TEXT,
  delivery_address TEXT,
  subtotal NUMERIC,
  fixed_fare NUMERIC,
  dispatch_mode public.delivery_dispatch_mode,
  status public.delivery_status,
  offer_deadline_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  my_offer_price NUMERIC,
  my_offer_status TEXT,
  delivery_lng DOUBLE PRECISION,
  delivery_lat DOUBLE PRECISION,
  branch_lng DOUBLE PRECISION,
  branch_lat DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  v_driver_id := public.get_my_driver_id();
  IF v_driver_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.drivers d WHERE d.id = v_driver_id AND d.status = 'approved'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    dr.id,
    o.id,
    o.order_number,
    b.name,
    m.name,
    o.delivery_commune,
    o.delivery_city,
    o.delivery_address,
    o.subtotal,
    dr.fixed_fare,
    dr.dispatch_mode,
    dr.status,
    dr.offer_deadline_at,
    dr.published_at,
    off.offered_price,
    off.status,
    extensions.ST_X(o.delivery_location::extensions.geometry),
    extensions.ST_Y(o.delivery_location::extensions.geometry),
    extensions.ST_X(b.location::extensions.geometry),
    extensions.ST_Y(b.location::extensions.geometry)
  FROM public.delivery_requests dr
  JOIN public.orders o ON o.id = dr.order_id
  JOIN public.branches b ON b.id = dr.branch_id
  JOIN public.merchants m ON m.id = o.merchant_id
  LEFT JOIN public.delivery_offers off
    ON off.delivery_request_id = dr.id AND off.driver_id = v_driver_id
  WHERE dr.status IN ('searching_driver', 'receiving_offers')
    AND o.status NOT IN ('cancelled', 'delivered')
  ORDER BY dr.published_at DESC NULLS LAST;
END;
$$;

DROP FUNCTION IF EXISTS public.get_my_active_delivery();
CREATE OR REPLACE FUNCTION public.get_my_active_delivery()
RETURNS TABLE (
  delivery_request_id UUID,
  order_id UUID,
  order_number TEXT,
  status public.delivery_status,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  offered_price NUMERIC,
  pickup_code TEXT,
  delivery_pin TEXT,
  merchant_name TEXT,
  branch_name TEXT,
  delivery_lng DOUBLE PRECISION,
  delivery_lat DOUBLE PRECISION,
  branch_lng DOUBLE PRECISION,
  branch_lat DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
    dr.id,
    o.id,
    o.order_number,
    dr.status,
    o.customer_name,
    o.customer_phone,
    o.delivery_address,
    off.offered_price,
    da.pickup_code,
    da.delivery_pin,
    m.name,
    b.name,
    extensions.ST_X(o.delivery_location::extensions.geometry),
    extensions.ST_Y(o.delivery_location::extensions.geometry),
    extensions.ST_X(b.location::extensions.geometry),
    extensions.ST_Y(b.location::extensions.geometry)
  FROM public.delivery_assignments da
  JOIN public.delivery_requests dr ON dr.id = da.delivery_request_id
  JOIN public.orders o ON o.id = dr.order_id
  JOIN public.merchants m ON m.id = o.merchant_id
  JOIN public.branches b ON b.id = dr.branch_id
  LEFT JOIN public.delivery_offers off ON off.id = da.offer_id
  WHERE da.driver_id = v_driver_id
    AND dr.status NOT IN ('delivered', 'cancelled', 'returned', 'failed_delivery')
  ORDER BY da.assigned_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_order_delivery_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_branch_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_map_points(UUID) TO authenticated;

-- Ubicación demo El Pollón (Santiago centro) si existe el seed
UPDATE public.branches
SET location = extensions.ST_SetSRID(
  extensions.ST_MakePoint(-70.6483, -33.4569),
  4326
)::extensions.geography
WHERE id = 'b1000000-0000-4000-8000-000000000001'
  AND location IS NULL;
