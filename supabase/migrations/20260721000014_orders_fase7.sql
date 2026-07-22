-- PedidosGo Fase 7: ciclo de vida de pedidos, publicación y ofertas

-- Drivers aprobados pueden ver solicitudes abiertas (marketplace)
DROP POLICY IF EXISTS delivery_requests_driver_marketplace ON public.delivery_requests;
CREATE POLICY delivery_requests_driver_marketplace ON public.delivery_requests
  FOR SELECT TO authenticated
  USING (
    status IN ('searching_driver', 'receiving_offers')
    AND EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.user_id = auth.uid()
        AND d.status = 'approved'
    )
  );

-- Historial de estados: insert solo vía RPC (service/definer); allow select ya existe
DROP POLICY IF EXISTS order_status_history_insert_admin ON public.order_status_history;
CREATE POLICY order_status_history_insert_admin ON public.order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS delivery_events_access ON public.delivery_events;
CREATE POLICY delivery_events_access ON public.delivery_events
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.delivery_requests dr
      WHERE dr.id = delivery_request_id
        AND (
          public.user_belongs_to_branch(dr.branch_id)
          OR EXISTS (
            SELECT 1 FROM public.delivery_assignments da
            WHERE da.delivery_request_id = dr.id
              AND da.driver_id = public.get_my_driver_id()
          )
        )
    )
  );

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_num TEXT;
BEGIN
  v_num := 'PG-' || to_char(NOW(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  RETURN v_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_order_status(
  p_order_id UUID,
  p_previous public.order_status,
  p_new public.order_status,
  p_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.order_status_history (
    order_id, previous_status, new_status, changed_by, comment
  ) VALUES (
    p_order_id, p_previous, p_new, auth.uid(), p_comment
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_delivery_event(
  p_request_id UUID,
  p_previous public.delivery_status,
  p_new public.delivery_status,
  p_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.delivery_events (
    delivery_request_id, previous_status, new_status, actor_id, comment, source
  ) VALUES (
    p_request_id, p_previous, p_new, auth.uid(), p_comment, 'rpc'
  );
END;
$$;

-- Crear pedido manual (+ ítems + delivery_request borrador)
CREATE OR REPLACE FUNCTION public.create_manual_order(
  p_branch_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_delivery_address TEXT,
  p_delivery_commune TEXT,
  p_delivery_city TEXT,
  p_items JSONB,
  p_payment_method public.payment_method DEFAULT 'cash',
  p_amount_to_collect NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_delivery_fee NUMERIC DEFAULT 0,
  p_delivery_apartment TEXT DEFAULT NULL,
  p_delivery_references TEXT DEFAULT NULL,
  p_publish BOOLEAN DEFAULT FALSE,
  p_fixed_fare NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v_order_id UUID;
  v_subtotal NUMERIC(12, 2) := 0;
  v_item JSONB;
  v_qty NUMERIC;
  v_price NUMERIC;
  v_line NUMERIC;
  v_request_id UUID;
  v_settings public.branch_settings%ROWTYPE;
  v_dispatch public.delivery_dispatch_mode;
BEGIN
  IF NOT (public.is_admin() OR public.user_belongs_to_branch(p_branch_id)) THEN
    RAISE EXCEPTION 'Sin permiso para crear pedidos en esta sucursal';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 THEN
    RAISE EXCEPTION 'El pedido necesita al menos un ítem';
  END IF;

  SELECT merchant_id INTO v_merchant_id
  FROM public.branches
  WHERE id = p_branch_id AND is_active = TRUE;

  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Sucursal no encontrada o inactiva';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := GREATEST(COALESCE((v_item ->> 'quantity')::NUMERIC, 1), 0.01);
    v_price := GREATEST(COALESCE((v_item ->> 'unit_price')::NUMERIC, 0), 0);
    v_subtotal := v_subtotal + round(v_qty * v_price, 2);
  END LOOP;

  INSERT INTO public.orders (
    order_number, merchant_id, branch_id,
    customer_name, customer_phone,
    delivery_address, delivery_commune, delivery_city,
    delivery_apartment, delivery_references,
    subtotal, delivery_fee, total,
    payment_method, payment_status, amount_to_collect,
    status, notes, source
  ) VALUES (
    public.generate_order_number(),
    v_merchant_id,
    p_branch_id,
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_delivery_address),
    NULLIF(trim(p_delivery_commune), ''),
    NULLIF(trim(p_delivery_city), ''),
    NULLIF(trim(COALESCE(p_delivery_apartment, '')), ''),
    NULLIF(trim(COALESCE(p_delivery_references, '')), ''),
    v_subtotal,
    COALESCE(p_delivery_fee, 0),
    v_subtotal + COALESCE(p_delivery_fee, 0),
    p_payment_method,
    'pending',
    COALESCE(p_amount_to_collect, 0),
    'pending',
    NULLIF(trim(COALESCE(p_notes, '')), ''),
    'manual'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := GREATEST(COALESCE((v_item ->> 'quantity')::NUMERIC, 1), 0.01);
    v_price := GREATEST(COALESCE((v_item ->> 'unit_price')::NUMERIC, 0), 0);
    v_line := round(v_qty * v_price, 2);
    INSERT INTO public.order_items (
      order_id, product_name, quantity, unit_price, total_price, notes
    ) VALUES (
      v_order_id,
      trim(v_item ->> 'product_name'),
      v_qty,
      v_price,
      v_line,
      NULLIF(trim(COALESCE(v_item ->> 'notes', '')), '')
    );
  END LOOP;

  PERFORM public.record_order_status(v_order_id, NULL, 'pending', 'Pedido creado');

  SELECT * INTO v_settings FROM public.branch_settings WHERE branch_id = p_branch_id;
  v_dispatch := COALESCE(v_settings.delivery_dispatch_mode, 'manual');

  INSERT INTO public.delivery_requests (
    order_id, branch_id, status, dispatch_mode,
    fixed_fare, search_radius_km
  ) VALUES (
    v_order_id,
    p_branch_id,
    'created',
    v_dispatch,
    p_fixed_fare,
    COALESCE(v_settings.default_search_radius_km, 5)
  )
  RETURNING id INTO v_request_id;

  PERFORM public.record_delivery_event(v_request_id, NULL, 'created', 'Solicitud de delivery creada');

  IF p_publish THEN
    PERFORM public.publish_delivery_request(v_order_id, p_fixed_fare);
  END IF;

  PERFORM public.write_audit_log(
    'order_created',
    'orders',
    v_order_id,
    jsonb_build_object('branch_id', p_branch_id, 'publish', p_publish)
  );

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status public.order_status,
  p_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_allowed BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF NOT (public.is_admin() OR public.user_belongs_to_branch(v_order.branch_id)) THEN
    RAISE EXCEPTION 'Sin permiso para cambiar el estado';
  END IF;

  IF v_order.status = p_new_status THEN
    RETURN;
  END IF;

  IF v_order.status = 'cancelled' OR v_order.status = 'delivered' THEN
    RAISE EXCEPTION 'No se puede cambiar un pedido %', v_order.status;
  END IF;

  IF p_new_status = 'cancelled' THEN
    v_allowed := TRUE;
  ELSIF v_order.status = 'pending' AND p_new_status IN ('confirmed', 'preparing') THEN
    v_allowed := TRUE;
  ELSIF v_order.status = 'confirmed' AND p_new_status IN ('preparing', 'ready') THEN
    v_allowed := TRUE;
  ELSIF v_order.status = 'preparing' AND p_new_status = 'ready' THEN
    v_allowed := TRUE;
  ELSIF v_order.status = 'ready' AND p_new_status = 'out_for_delivery' THEN
    v_allowed := TRUE;
  ELSIF v_order.status = 'out_for_delivery' AND p_new_status = 'delivered' THEN
    v_allowed := TRUE;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Transición inválida: % → %', v_order.status, p_new_status;
  END IF;

  UPDATE public.orders
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_order_id;

  PERFORM public.record_order_status(p_order_id, v_order.status, p_new_status, p_comment);

  IF p_new_status = 'cancelled' THEN
    UPDATE public.delivery_requests
    SET status = 'cancelled', updated_at = NOW()
    WHERE order_id = p_order_id
      AND status NOT IN ('delivered', 'cancelled', 'returned');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_delivery_request(
  p_order_id UUID,
  p_fixed_fare NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_req public.delivery_requests%ROWTYPE;
  v_settings public.branch_settings%ROWTYPE;
  v_prev public.delivery_status;
  v_new public.delivery_status;
  v_timeout INTEGER;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF NOT (public.is_admin() OR public.user_belongs_to_branch(v_order.branch_id)) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;

  IF v_order.status IN ('cancelled', 'delivered') THEN
    RAISE EXCEPTION 'No se puede publicar un pedido %', v_order.status;
  END IF;

  SELECT * INTO v_req FROM public.delivery_requests WHERE order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay solicitud de delivery';
  END IF;

  IF v_req.status IN ('driver_selected', 'order_picked_up', 'heading_to_customer', 'delivered') THEN
    RAISE EXCEPTION 'La entrega ya tiene repartidor o está en curso';
  END IF;

  SELECT * INTO v_settings FROM public.branch_settings WHERE branch_id = v_order.branch_id;
  v_timeout := COALESCE(v_settings.offer_timeout_seconds, 120);
  v_prev := v_req.status;

  IF COALESCE(v_settings.allow_driver_offers, TRUE) THEN
    v_new := 'receiving_offers';
  ELSE
    v_new := 'searching_driver';
  END IF;

  UPDATE public.delivery_requests
  SET
    status = v_new,
    dispatch_mode = COALESCE(v_settings.delivery_dispatch_mode, dispatch_mode),
    fixed_fare = COALESCE(p_fixed_fare, fixed_fare),
    search_radius_km = COALESCE(v_settings.default_search_radius_km, search_radius_km),
    offer_deadline_at = NOW() + make_interval(secs => v_timeout),
    published_at = COALESCE(published_at, NOW()),
    updated_at = NOW()
  WHERE id = v_req.id;

  PERFORM public.record_delivery_event(v_req.id, v_prev, v_new, 'Publicado para repartidores');

  -- Si el pedido sigue pending, confirmarlo automáticamente al publicar
  IF v_order.status = 'pending' THEN
    PERFORM public.update_order_status(p_order_id, 'confirmed', 'Confirmado al publicar delivery');
  END IF;

  RETURN v_req.id;
END;
$$;

-- Asignación interna (oferta aceptada)
CREATE OR REPLACE FUNCTION public._assign_offer(p_offer_id UUID, p_auto BOOLEAN DEFAULT FALSE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.delivery_offers%ROWTYPE;
  v_req public.delivery_requests%ROWTYPE;
  v_order_id UUID;
  v_prev public.delivery_status;
  v_assignment_id UUID;
  v_pin TEXT;
BEGIN
  SELECT * INTO v_offer FROM public.delivery_offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Oferta no encontrada';
  END IF;

  IF v_offer.status <> 'pending' THEN
    RAISE EXCEPTION 'La oferta ya no está pendiente';
  END IF;

  SELECT * INTO v_req FROM public.delivery_requests WHERE id = v_offer.delivery_request_id FOR UPDATE;
  IF v_req.status NOT IN ('receiving_offers', 'searching_driver', 'waiting_dispatch') THEN
    RAISE EXCEPTION 'La solicitud ya no acepta ofertas';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.delivery_assignments WHERE delivery_request_id = v_req.id
  ) THEN
    RAISE EXCEPTION 'Ya hay un repartidor asignado';
  END IF;

  UPDATE public.delivery_offers
  SET status = 'accepted'
  WHERE id = p_offer_id;

  UPDATE public.delivery_offers
  SET status = 'rejected'
  WHERE delivery_request_id = v_req.id
    AND id <> p_offer_id
    AND status = 'pending';

  v_pin := lpad((floor(random() * 10000))::INT::TEXT, 4, '0');
  v_prev := v_req.status;

  INSERT INTO public.delivery_assignments (
    delivery_request_id, driver_id, offer_id, assigned_by,
    pickup_code, delivery_pin, tracking_token, tracking_token_expires_at
  ) VALUES (
    v_req.id,
    v_offer.driver_id,
    p_offer_id,
    CASE WHEN p_auto THEN NULL ELSE auth.uid() END,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
    v_pin,
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    NOW() + INTERVAL '48 hours'
  )
  RETURNING id INTO v_assignment_id;

  UPDATE public.delivery_requests
  SET status = 'driver_selected', updated_at = NOW()
  WHERE id = v_req.id;

  PERFORM public.record_delivery_event(
    v_req.id, v_prev, 'driver_selected',
    CASE WHEN p_auto THEN 'Asignación automática' ELSE 'Oferta aceptada por el comercio' END
  );

  SELECT order_id INTO v_order_id FROM public.delivery_requests WHERE id = v_req.id;

  UPDATE public.orders
  SET delivery_fee = v_offer.offered_price, updated_at = NOW()
  WHERE id = v_order_id;

  UPDATE public.orders
  SET total = subtotal + delivery_fee, updated_at = NOW()
  WHERE id = v_order_id;

  UPDATE public.driver_availability
  SET status = 'busy', updated_at = NOW()
  WHERE driver_id = v_offer.driver_id;

  RETURN v_assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_delivery_offer(p_offer_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.delivery_offers%ROWTYPE;
  v_branch_id UUID;
BEGIN
  SELECT * INTO v_offer FROM public.delivery_offers WHERE id = p_offer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Oferta no encontrada';
  END IF;

  SELECT branch_id INTO v_branch_id
  FROM public.delivery_requests
  WHERE id = v_offer.delivery_request_id;

  IF NOT (public.is_admin() OR public.user_belongs_to_branch(v_branch_id)) THEN
    RAISE EXCEPTION 'Sin permiso para aceptar ofertas';
  END IF;

  RETURN public._assign_offer(p_offer_id, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_delivery_offer(
  p_delivery_request_id UUID,
  p_offered_price NUMERIC,
  p_estimated_minutes INTEGER DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_req public.delivery_requests%ROWTYPE;
  v_settings public.branch_settings%ROWTYPE;
  v_offer_id UUID;
  v_strategy public.auto_selection_strategy;
BEGIN
  v_driver_id := public.get_my_driver_id();
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'No eres repartidor';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.drivers d WHERE d.id = v_driver_id AND d.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Solo repartidores aprobados pueden ofertar';
  END IF;

  SELECT * INTO v_req FROM public.delivery_requests WHERE id = p_delivery_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;

  IF v_req.status NOT IN ('receiving_offers', 'searching_driver') THEN
    RAISE EXCEPTION 'Esta solicitud no recibe ofertas';
  END IF;

  IF v_req.offer_deadline_at IS NOT NULL AND v_req.offer_deadline_at < NOW() THEN
    RAISE EXCEPTION 'El plazo de ofertas expiró';
  END IF;

  SELECT * INTO v_settings FROM public.branch_settings WHERE branch_id = v_req.branch_id;

  IF v_req.fixed_fare IS NOT NULL AND COALESCE(v_settings.allow_driver_offers, TRUE) = FALSE THEN
    IF p_offered_price <> v_req.fixed_fare THEN
      RAISE EXCEPTION 'Debes aceptar la tarifa fija de %', v_req.fixed_fare;
    END IF;
  END IF;

  IF p_offered_price IS NULL OR p_offered_price <= 0 THEN
    RAISE EXCEPTION 'Precio de oferta inválido';
  END IF;

  INSERT INTO public.delivery_offers (
    delivery_request_id, driver_id, offered_price, estimated_minutes, message, status, expires_at
  ) VALUES (
    p_delivery_request_id,
    v_driver_id,
    p_offered_price,
    p_estimated_minutes,
    NULLIF(trim(COALESCE(p_message, '')), ''),
    'pending',
    v_req.offer_deadline_at
  )
  ON CONFLICT (delivery_request_id, driver_id) DO UPDATE
    SET offered_price = EXCLUDED.offered_price,
        estimated_minutes = EXCLUDED.estimated_minutes,
        message = EXCLUDED.message,
        status = 'pending',
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()
  RETURNING id INTO v_offer_id;

  -- Automático + first_accepted: primera oferta gana
  v_strategy := COALESCE(v_settings.auto_selection_strategy, 'balanced_score');
  IF v_req.dispatch_mode = 'automatic'
     AND v_strategy = 'first_accepted'
     AND NOT EXISTS (
       SELECT 1 FROM public.delivery_assignments WHERE delivery_request_id = v_req.id
     )
  THEN
    PERFORM public._assign_offer(v_offer_id, TRUE);
  END IF;

  RETURN v_offer_id;
END;
$$;

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

  -- Transiciones simplificadas MVP
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
  END IF;
END;
$$;

-- Marketplace: listado sanitizado para drivers
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
  my_offer_status TEXT
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
    off.status
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
  branch_name TEXT
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
    b.name
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

GRANT EXECUTE ON FUNCTION public.generate_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_manual_order(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB,
  public.payment_method, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, BOOLEAN, NUMERIC
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, public.order_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_delivery_request(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_delivery_offer(UUID, NUMERIC, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_delivery_offer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_delivery_status(UUID, public.delivery_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_open_delivery_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_active_delivery() TO authenticated;
-- _assign_offer, record_* quedan sin grant público (solo uso interno / mismo owner)
