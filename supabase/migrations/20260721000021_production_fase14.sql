-- PedidosGo Fase 14: hardening producción

-- ---------------------------------------------------------------------------
-- Rate limit simple (ventanas por bucket)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rpc_rate_limits (
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

CREATE OR REPLACE FUNCTION public.assert_rate_limit(
  p_bucket TEXT,
  p_max_requests INTEGER DEFAULT 120,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF NULLIF(trim(p_bucket), '') IS NULL THEN
    RETURN;
  END IF;

  v_window := to_timestamp(
    floor(extract(epoch FROM NOW()) / GREATEST(p_window_seconds, 1)) * GREATEST(p_window_seconds, 1)
  );

  INSERT INTO public.rpc_rate_limits (bucket, window_start, request_count)
  VALUES (p_bucket, v_window, 1)
  ON CONFLICT (bucket, window_start) DO UPDATE
    SET request_count = public.rpc_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  IF v_count > p_max_requests THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

-- Limpieza ocasional (ventanas > 2 h)
CREATE OR REPLACE FUNCTION public.prune_rpc_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.rpc_rate_limits
  WHERE window_start < NOW() - INTERVAL '2 hours';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ---------------------------------------------------------------------------
-- Proteger tracking público contra abuso
-- ---------------------------------------------------------------------------
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
STABLE
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

-- ---------------------------------------------------------------------------
-- Errores de cliente → system_errors (sin PII sensible)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_client_error(
  p_source TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NULLIF(trim(p_source), '') IS NULL OR NULLIF(trim(p_message), '') IS NULL THEN
    RAISE EXCEPTION 'source y message son obligatorios';
  END IF;

  IF length(p_message) > 2000 THEN
    RAISE EXCEPTION 'message demasiado largo';
  END IF;

  INSERT INTO public.system_errors (source, message, stack_trace, metadata)
  VALUES (
    left(trim(p_source), 120),
    left(trim(p_message), 2000),
    NULLIF(left(trim(COALESCE(p_stack_trace, '')), 8000), ''),
    COALESCE(p_metadata, '{}'::JSONB) || jsonb_build_object('user_id', auth.uid())
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Salud de plataforma (solo admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_platform_health()
RETURNS TABLE (
  pending_driver_applications BIGINT,
  pending_commission_payments BIGINT,
  active_deliveries BIGINT,
  open_delivery_jobs BIGINT,
  public_tracking_enabled BOOLEAN,
  notifications_realtime BOOLEAN,
  rate_limit_buckets BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.drivers d WHERE d.status IN ('submitted', 'under_review', 'changes_required')),
    (SELECT COUNT(*) FROM public.payments p WHERE p.status = 'pending'),
    (SELECT COUNT(*) FROM public.delivery_requests dr WHERE dr.status NOT IN ('delivered', 'cancelled', 'created', 'waiting_dispatch')),
    (SELECT COUNT(*) FROM public.delivery_requests dr WHERE dr.status IN ('searching_driver', 'receiving_offers')),
    COALESCE((SELECT ff.enabled FROM public.feature_flags ff WHERE ff.key = 'public_tracking'), FALSE),
    EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ),
    (SELECT COUNT(*) FROM public.rpc_rate_limits);
END;
$$;

-- RLS: rate_limits solo admin (tabla interna)
ALTER TABLE public.rpc_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY rpc_rate_limits_admin ON public.rpc_rate_limits
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT EXECUTE ON FUNCTION public.assert_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.prune_rpc_rate_limits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_client_error(TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_health() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.assert_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prune_rpc_rate_limits() FROM PUBLIC;

COMMENT ON FUNCTION public.get_platform_health() IS 'Fase 14: resumen operativo para admin.';
COMMENT ON FUNCTION public.report_client_error(TEXT, TEXT, TEXT, JSONB) IS 'Fase 14: reportar errores de UI al backend.';
