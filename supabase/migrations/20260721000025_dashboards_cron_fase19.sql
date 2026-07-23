-- PedidosGo Fase 19: dashboards analíticos + despacho cron de webhooks

-- ---------------------------------------------------------------------------
-- claim webhooks también con service_role (cron)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_pending_webhook_deliveries(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  event_id UUID,
  merchant_id UUID,
  event_type TEXT,
  payload JSONB,
  webhook_id UUID,
  url TEXT,
  secret TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
  v_is_service BOOLEAN := (auth.role() = 'service_role');
BEGIN
  IF NOT (
    v_is_service
    OR public.is_admin()
    OR public.has_role('merchant_owner')
    OR public.has_role('merchant_admin')
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  WITH pending AS (
    SELECT e.id
    FROM public.webhook_events e
    WHERE e.status = 'pending'
      AND (
        v_is_service
        OR public.is_admin()
        OR public.user_belongs_to_merchant(e.merchant_id)
      )
    ORDER BY e.created_at
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  SELECT
    e.id,
    e.merchant_id,
    e.event_type,
    e.payload,
    w.id,
    w.url,
    w.secret
  FROM pending p
  JOIN public.webhook_events e ON e.id = p.id
  JOIN public.merchant_webhooks w
    ON w.merchant_id = e.merchant_id
   AND w.is_active = TRUE
   AND (
     e.event_type = ANY (w.events)
     OR 'order.status_changed' = ANY (w.events)
     OR '*' = ANY (w.events)
   );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_webhook_event_result(
  p_event_id UUID,
  p_ok BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
BEGIN
  SELECT merchant_id INTO v_merchant_id
  FROM public.webhook_events
  WHERE id = p_event_id;

  IF v_merchant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT (
    auth.role() = 'service_role'
    OR public.is_admin()
    OR public.user_belongs_to_merchant(v_merchant_id)
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.webhook_events
  SET
    status = CASE WHEN p_ok THEN 'delivered' ELSE 'failed' END,
    attempts = attempts + 1,
    last_error = CASE WHEN p_ok THEN NULL ELSE left(COALESCE(p_error, 'error'), 500) END,
    processed_at = NOW()
  WHERE id = p_event_id;

  RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------------
-- Dashboard admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  SELECT jsonb_build_object(
    'drivers_available', (
      SELECT COUNT(*) FROM public.driver_availability da
      JOIN public.drivers d ON d.id = da.driver_id
      WHERE d.status = 'approved' AND da.status = 'available'
    ),
    'drivers_busy', (
      SELECT COUNT(*) FROM public.driver_availability da
      JOIN public.drivers d ON d.id = da.driver_id
      WHERE d.status = 'approved' AND da.status = 'busy'
    ),
    'drivers_offline', (
      SELECT COUNT(*) FROM public.driver_availability da
      JOIN public.drivers d ON d.id = da.driver_id
      WHERE d.status = 'approved' AND da.status = 'offline'
    ),
    'drivers_pending', (
      SELECT COUNT(*) FROM public.drivers d
      WHERE d.status IN ('submitted', 'under_review', 'changes_required')
    ),
    'orders_active', (
      SELECT COUNT(*) FROM public.orders o
      WHERE o.status NOT IN ('delivered', 'cancelled')
    ),
    'orders_delivered_today', (
      SELECT COUNT(*) FROM public.orders o
      WHERE o.status = 'delivered'
        AND o.updated_at >= date_trunc('day', NOW())
    ),
    'orders_cancelled_today', (
      SELECT COUNT(*) FROM public.orders o
      WHERE o.status = 'cancelled'
        AND o.updated_at >= date_trunc('day', NOW())
    ),
    'jobs_searching', (
      SELECT COUNT(*) FROM public.delivery_requests dr
      WHERE dr.status IN ('searching_driver', 'receiving_offers')
    ),
    'commission_pending', (
      SELECT COUNT(*) FROM public.payments p WHERE p.status = 'pending'
    ),
    'commission_pending_amount', (
      SELECT COALESCE(SUM(p.amount), 0) FROM public.payments p WHERE p.status = 'pending'
    ),
    'open_support_tickets', (
      SELECT COUNT(*) FROM public.support_tickets t
      WHERE t.status IN ('open', 'in_progress')
    ),
    'webhooks_pending', (
      SELECT COUNT(*) FROM public.webhook_events e WHERE e.status = 'pending'
    ),
    'merchants_active', (
      SELECT COUNT(*) FROM public.merchants m WHERE m.is_active = TRUE AND m.is_approved = TRUE
    ),
    'avg_driver_rating', (
      SELECT COALESCE(ROUND(AVG(d.average_rating)::numeric, 2), 0)
      FROM public.drivers d
      WHERE d.status = 'approved' AND d.completed_deliveries > 0
    )
  )
  INTO v;

  RETURN v;
END;
$$;

-- ---------------------------------------------------------------------------
-- Dashboard comercio
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_merchant_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v JSONB;
BEGIN
  SELECT mu.merchant_id INTO v_merchant_id
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid()
    AND mu.is_active = TRUE
  ORDER BY mu.created_at
  LIMIT 1;

  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Sin comercio asociado';
  END IF;

  SELECT jsonb_build_object(
    'orders_today', (
      SELECT COUNT(*) FROM public.orders o
      WHERE o.merchant_id = v_merchant_id
        AND o.created_at >= date_trunc('day', NOW())
    ),
    'orders_active', (
      SELECT COUNT(*) FROM public.orders o
      WHERE o.merchant_id = v_merchant_id
        AND o.status NOT IN ('delivered', 'cancelled')
    ),
    'orders_delivered_today', (
      SELECT COUNT(*) FROM public.orders o
      WHERE o.merchant_id = v_merchant_id
        AND o.status = 'delivered'
        AND o.updated_at >= date_trunc('day', NOW())
    ),
    'orders_cancelled_today', (
      SELECT COUNT(*) FROM public.orders o
      WHERE o.merchant_id = v_merchant_id
        AND o.status = 'cancelled'
        AND o.updated_at >= date_trunc('day', NOW())
    ),
    'jobs_searching', (
      SELECT COUNT(*) FROM public.delivery_requests dr
      JOIN public.orders o ON o.id = dr.order_id
      WHERE o.merchant_id = v_merchant_id
        AND dr.status IN ('searching_driver', 'receiving_offers')
    ),
    'webhooks_pending', (
      SELECT COUNT(*) FROM public.webhook_events e
      WHERE e.merchant_id = v_merchant_id AND e.status = 'pending'
    ),
    'webhooks_failed_today', (
      SELECT COUNT(*) FROM public.webhook_events e
      WHERE e.merchant_id = v_merchant_id
        AND e.status = 'failed'
        AND e.created_at >= date_trunc('day', NOW())
    ),
    'branches_active', (
      SELECT COUNT(*) FROM public.branches b
      WHERE b.merchant_id = v_merchant_id AND b.is_active = TRUE
    )
  )
  INTO v;

  RETURN v;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_merchant_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_webhook_deliveries(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_webhook_event_result(UUID, BOOLEAN, TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_admin_dashboard_metrics() IS 'Fase 19: métricas del panel superadmin.';
COMMENT ON FUNCTION public.get_merchant_dashboard_metrics() IS 'Fase 19: métricas del panel comercio.';
