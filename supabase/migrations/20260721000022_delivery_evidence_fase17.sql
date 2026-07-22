-- PedidosGo Fase 17: evidencia fotográfica de entrega

-- Feature flag
INSERT INTO public.feature_flags (key, enabled, description)
VALUES (
  'require_delivery_evidence',
  TRUE,
  'Exigir al menos una foto de evidencia antes de marcar entregado'
)
ON CONFLICT (key) DO UPDATE
  SET description = EXCLUDED.description,
      updated_at = NOW();

-- RLS delivery_evidence
DROP POLICY IF EXISTS delivery_evidence_select ON public.delivery_evidence;
DROP POLICY IF EXISTS delivery_evidence_insert ON public.delivery_evidence;

CREATE POLICY delivery_evidence_select ON public.delivery_evidence
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR captured_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.delivery_requests dr
      JOIN public.delivery_assignments da ON da.delivery_request_id = dr.id
      WHERE dr.id = delivery_evidence.delivery_request_id
        AND da.driver_id = public.get_my_driver_id()
    )
    OR EXISTS (
      SELECT 1
      FROM public.delivery_requests dr
      WHERE dr.id = delivery_evidence.delivery_request_id
        AND public.user_belongs_to_branch(dr.branch_id)
    )
  );

CREATE POLICY delivery_evidence_insert ON public.delivery_evidence
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      captured_by = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.delivery_assignments da
        WHERE da.delivery_request_id = delivery_evidence.delivery_request_id
          AND da.driver_id = public.get_my_driver_id()
      )
    )
  );

-- Registrar evidencia (tras upload a Storage)
CREATE OR REPLACE FUNCTION public.register_delivery_evidence(
  p_delivery_request_id UUID,
  p_storage_path TEXT,
  p_evidence_type TEXT DEFAULT 'photo_delivery',
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_id UUID;
  v_type TEXT := COALESCE(NULLIF(trim(p_evidence_type), ''), 'photo_delivery');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NULLIF(trim(p_storage_path), '') IS NULL THEN
    RAISE EXCEPTION 'storage_path obligatorio';
  END IF;

  -- Path debe empezar con el uid del usuario (política Storage)
  IF split_part(p_storage_path, '/', 1) <> auth.uid()::TEXT AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Ruta de storage inválida';
  END IF;

  v_driver_id := public.get_my_driver_id();

  IF NOT public.is_admin() THEN
    IF v_driver_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.delivery_assignments da
      WHERE da.delivery_request_id = p_delivery_request_id
        AND da.driver_id = v_driver_id
    ) THEN
      RAISE EXCEPTION 'Sin permiso para esta entrega';
    END IF;
  END IF;

  IF v_type NOT IN ('photo_delivery', 'photo_pickup', 'signature', 'other') THEN
    RAISE EXCEPTION 'evidence_type inválido';
  END IF;

  INSERT INTO public.delivery_evidence (
    delivery_request_id, evidence_type, storage_path, captured_by, metadata
  ) VALUES (
    p_delivery_request_id,
    v_type,
    trim(p_storage_path),
    auth.uid(),
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Listar evidencias de un pedido (con URL firmada la genera el cliente)
CREATE OR REPLACE FUNCTION public.list_delivery_evidence(p_order_id UUID)
RETURNS TABLE (
  evidence_id UUID,
  delivery_request_id UUID,
  evidence_type TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ,
  captured_by UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
  v_request_id UUID;
  v_driver_id UUID;
BEGIN
  SELECT o.branch_id, dr.id, da.driver_id
  INTO v_branch_id, v_request_id, v_driver_id
  FROM public.orders o
  JOIN public.delivery_requests dr ON dr.order_id = o.id
  LEFT JOIN public.delivery_assignments da ON da.delivery_request_id = dr.id
  WHERE o.id = p_order_id;

  IF v_request_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT (
    public.is_admin()
    OR public.user_belongs_to_branch(v_branch_id)
    OR v_driver_id = public.get_my_driver_id()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.delivery_request_id,
    e.evidence_type,
    e.storage_path,
    e.created_at,
    e.captured_by
  FROM public.delivery_evidence e
  WHERE e.delivery_request_id = v_request_id
  ORDER BY e.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_delivery_evidence(p_delivery_request_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.delivery_evidence e
    WHERE e.delivery_request_id = p_delivery_request_id
  );
END;
$$;

-- Enganchar: exigir evidencia si el flag está activo
CREATE OR REPLACE FUNCTION public.advance_delivery_status(
  p_delivery_request_id UUID,
  p_new_status public.delivery_status,
  p_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.delivery_requests%ROWTYPE;
  v_driver_id UUID;
  v_is_merchant BOOLEAN;
  v_prev public.delivery_status;
  v_order_id UUID;
  v_order_status public.order_status;
  v_require_evidence BOOLEAN;
  v_evidence_count INTEGER;
BEGIN
  v_driver_id := public.get_my_driver_id();
  SELECT * INTO v_req FROM public.delivery_requests WHERE id = p_delivery_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;

  v_is_merchant := public.is_admin() OR public.user_belongs_to_branch(v_req.branch_id);

  IF NOT v_is_merchant THEN
    IF v_driver_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.delivery_assignments da
      WHERE da.delivery_request_id = v_req.id AND da.driver_id = v_driver_id
    ) THEN
      RAISE EXCEPTION 'Sin permiso';
    END IF;
  END IF;

  v_prev := v_req.status;

  IF NOT (
    (v_prev = 'driver_selected' AND p_new_status = 'driver_heading_to_store')
    OR (v_prev = 'driver_heading_to_store' AND p_new_status IN ('driver_arrived_store', 'order_picked_up'))
    OR (v_prev = 'driver_arrived_store' AND p_new_status = 'order_picked_up')
    OR (v_prev = 'order_picked_up' AND p_new_status = 'heading_to_customer')
    OR (v_prev = 'heading_to_customer' AND p_new_status IN ('driver_arrived_customer', 'delivered'))
    OR (v_prev = 'driver_arrived_customer' AND p_new_status = 'delivered')
    OR (v_is_merchant AND p_new_status = 'cancelled' AND v_prev NOT IN ('delivered', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'Transición de delivery inválida: % → %', v_prev, p_new_status;
  END IF;

  IF p_new_status = 'delivered' AND NOT v_is_merchant THEN
    SELECT COALESCE(ff.enabled, FALSE) INTO v_require_evidence
    FROM public.feature_flags ff
    WHERE ff.key = 'require_delivery_evidence';

    IF COALESCE(v_require_evidence, FALSE) THEN
      SELECT COUNT(*)::INTEGER INTO v_evidence_count
      FROM public.delivery_evidence e
      WHERE e.delivery_request_id = p_delivery_request_id
        AND e.evidence_type IN ('photo_delivery', 'signature', 'other');

      IF COALESCE(v_evidence_count, 0) < 1 THEN
        RAISE EXCEPTION 'Debes subir una foto de evidencia antes de marcar entregado';
      END IF;
    END IF;
  END IF;

  UPDATE public.delivery_requests
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_delivery_request_id;

  PERFORM public.record_delivery_event(p_delivery_request_id, v_prev, p_new_status, p_comment);

  SELECT order_id INTO v_order_id FROM public.delivery_requests WHERE id = p_delivery_request_id;

  IF p_new_status = 'order_picked_up' THEN
    SELECT status INTO v_order_status FROM public.orders WHERE id = v_order_id;
    IF v_order_status NOT IN ('delivered', 'cancelled', 'out_for_delivery') THEN
      UPDATE public.orders
      SET status = 'out_for_delivery', updated_at = NOW()
      WHERE id = v_order_id;
      PERFORM public.record_order_status(v_order_id, v_order_status, 'out_for_delivery', 'Pedido recogido');
    END IF;
  END IF;

  IF p_new_status = 'delivered' THEN
    SELECT status INTO v_order_status FROM public.orders WHERE id = v_order_id;
    UPDATE public.orders
    SET status = 'delivered', updated_at = NOW()
    WHERE id = v_order_id;
    IF v_order_status IS DISTINCT FROM 'delivered' THEN
      PERFORM public.record_order_status(v_order_id, v_order_status, 'delivered', 'Entregado');
    END IF;
    UPDATE public.driver_availability
    SET status = 'available', updated_at = NOW()
    WHERE driver_id = (
      SELECT driver_id FROM public.delivery_assignments WHERE delivery_request_id = p_delivery_request_id
    );

    PERFORM public.apply_delivery_commission(p_delivery_request_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_delivery_evidence(UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_delivery_evidence(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_delivery_evidence(UUID) TO authenticated;

COMMENT ON FUNCTION public.register_delivery_evidence(UUID, TEXT, TEXT, JSONB) IS
  'Fase 17: registra evidencia tras upload a bucket delivery-evidence.';
