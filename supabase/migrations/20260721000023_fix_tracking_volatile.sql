-- PedidosGo hotfix: get_public_tracking debe ser VOLATILE
-- (assert_rate_limit hace INSERT; STABLE fuerza transacción read-only → error 25006)

CREATE OR REPLACE FUNCTION public.get_public_tracking(p_token TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  error_code TEXT,
  order_number TEXT,
  order_status TEXT,
  delivery_status TEXT,
  merchant_name TEXT,
  branch_name TEXT,
  delivery_address TEXT,
  delivery_commune TEXT,
  delivery_city TEXT,
  delivery_pin TEXT,
  expires_at TIMESTAMPTZ,
  payment_method TEXT,
  total NUMERIC,
  amount_to_collect NUMERIC,
  customer_name TEXT,
  driver_first_name TEXT,
  branch_lat DOUBLE PRECISION,
  branch_lng DOUBLE PRECISION,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  driver_lat DOUBLE PRECISION,
  driver_lng DOUBLE PRECISION,
  driver_recorded_at TIMESTAMPTZ,
  show_driver_location BOOLEAN
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token TEXT := NULLIF(trim(p_token), '');
  v_flag BOOLEAN;
BEGIN
  BEGIN
    PERFORM public.assert_rate_limit('public_tracking', 180, 60);
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      RETURN QUERY SELECT
        FALSE, 'rate_limited'::TEXT,
        NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
        NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
        NULL::TIMESTAMPTZ, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC,
        NULL::TEXT, NULL::TEXT,
        NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
        NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
        NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
        NULL::TIMESTAMPTZ, FALSE;
      RETURN;
  END;

  IF v_token IS NULL OR length(v_token) < 16 THEN
    RETURN QUERY SELECT
      FALSE, 'invalid'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TIMESTAMPTZ, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC,
      NULL::TEXT, NULL::TEXT,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::TIMESTAMPTZ, FALSE;
    RETURN;
  END IF;

  SELECT ff.enabled INTO v_flag
  FROM public.feature_flags ff
  WHERE ff.key = 'public_tracking';

  IF COALESCE(v_flag, FALSE) IS NOT TRUE THEN
    RETURN QUERY SELECT
      FALSE, 'disabled'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TIMESTAMPTZ, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC,
      NULL::TEXT, NULL::TEXT,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::TIMESTAMPTZ, FALSE;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.delivery_assignments da WHERE da.tracking_token = v_token
  ) THEN
    RETURN QUERY SELECT
      FALSE, 'not_found'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TIMESTAMPTZ, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC,
      NULL::TEXT, NULL::TEXT,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::TIMESTAMPTZ, FALSE;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.delivery_assignments da
    WHERE da.tracking_token = v_token
      AND da.tracking_token_expires_at IS NOT NULL
      AND da.tracking_token_expires_at < NOW()
  ) THEN
    RETURN QUERY SELECT
      FALSE, 'expired'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TIMESTAMPTZ, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC,
      NULL::TEXT, NULL::TEXT,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION,
      NULL::TIMESTAMPTZ, FALSE;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    TRUE,
    NULL::TEXT,
    o.order_number,
    o.status::TEXT,
    dr.status::TEXT,
    m.name,
    b.name,
    o.delivery_address,
    o.delivery_commune,
    o.delivery_city,
    da.delivery_pin,
    da.tracking_token_expires_at,
    o.payment_method::TEXT,
    o.total,
    o.amount_to_collect,
    o.customer_name,
    NULLIF(trim(p.first_name), ''),
    ST_Y(b.location::geometry),
    ST_X(b.location::geometry),
    ST_Y(o.delivery_location::geometry),
    ST_X(o.delivery_location::geometry),
    CASE
      WHEN dr.status::TEXT IN (
        'driver_selected', 'driver_heading_to_store', 'driver_arrived_store',
        'order_picked_up', 'heading_to_customer', 'driver_arrived_customer'
      ) THEN COALESCE(dcl.lat, ST_Y(dcl.location::geometry))
      ELSE NULL
    END,
    CASE
      WHEN dr.status::TEXT IN (
        'driver_selected', 'driver_heading_to_store', 'driver_arrived_store',
        'order_picked_up', 'heading_to_customer', 'driver_arrived_customer'
      ) THEN COALESCE(dcl.lng, ST_X(dcl.location::geometry))
      ELSE NULL
    END,
    CASE
      WHEN dr.status::TEXT IN (
        'driver_selected', 'driver_heading_to_store', 'driver_arrived_store',
        'order_picked_up', 'heading_to_customer', 'driver_arrived_customer'
      ) THEN dcl.recorded_at
      ELSE NULL
    END,
    (
      dr.status::TEXT IN (
        'driver_selected', 'driver_heading_to_store', 'driver_arrived_store',
        'order_picked_up', 'heading_to_customer', 'driver_arrived_customer'
      )
    )
  FROM public.delivery_assignments da
  JOIN public.delivery_requests dr ON dr.id = da.delivery_request_id
  JOIN public.orders o ON o.id = dr.order_id
  JOIN public.merchants m ON m.id = o.merchant_id
  JOIN public.branches b ON b.id = o.branch_id
  JOIN public.drivers d ON d.id = da.driver_id
  LEFT JOIN public.profiles p ON p.id = d.user_id
  LEFT JOIN public.driver_current_locations dcl ON dcl.driver_id = da.driver_id
  WHERE da.tracking_token = v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_tracking(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_tracking(TEXT) IS
  'Hotfix: VOLATILE para permitir rate-limit (INSERT) sin error 25006.';
