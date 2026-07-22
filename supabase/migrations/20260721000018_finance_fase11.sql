-- PedidosGo Fase 11: comisiones al entregar + billetera

CREATE UNIQUE INDEX IF NOT EXISTS commissions_delivery_request_id_uidx
  ON public.commissions (delivery_request_id);

CREATE OR REPLACE FUNCTION public.get_active_commission_rule()
RETURNS public.commission_rules
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.commission_rules
  WHERE is_active = TRUE
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.apply_delivery_commission(p_delivery_request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_order_id UUID;
  v_base NUMERIC(12, 2);
  v_rule public.commission_rules%ROWTYPE;
  v_commission NUMERIC(12, 2);
  v_net NUMERIC(12, 2);
  v_wallet_id UUID;
  v_commission_id UUID;
  v_offer_price NUMERIC(12, 2);
BEGIN
  -- Idempotencia
  SELECT id INTO v_commission_id
  FROM public.commissions
  WHERE delivery_request_id = p_delivery_request_id;
  IF v_commission_id IS NOT NULL THEN
    RETURN v_commission_id;
  END IF;

  SELECT da.driver_id, dr.order_id, dr.fixed_fare
  INTO v_driver_id, v_order_id, v_base
  FROM public.delivery_requests dr
  JOIN public.delivery_assignments da ON da.delivery_request_id = dr.id
  WHERE dr.id = p_delivery_request_id;

  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Entrega sin repartidor asignado';
  END IF;

  -- Preferir precio de oferta aceptada
  SELECT off.offered_price INTO v_offer_price
  FROM public.delivery_assignments da
  JOIN public.delivery_offers off ON off.id = da.offer_id
  WHERE da.delivery_request_id = p_delivery_request_id;

  IF v_offer_price IS NOT NULL AND v_offer_price > 0 THEN
    v_base := v_offer_price;
  ELSIF v_base IS NULL OR v_base <= 0 THEN
    SELECT COALESCE(o.delivery_fee, 0) INTO v_base
    FROM public.orders o
    WHERE o.id = v_order_id;
  END IF;

  IF v_base IS NULL OR v_base < 0 THEN
    v_base := 0;
  END IF;

  SELECT * INTO v_rule FROM public.get_active_commission_rule();
  IF v_rule.id IS NULL THEN
    -- Fallback 0.5%
    v_commission := round(v_base * 0.005, 2);
  ELSE
    v_commission := round(v_base * v_rule.percentage, 2);
    IF v_commission < COALESCE(v_rule.minimum_commission, 0) THEN
      v_commission := v_rule.minimum_commission;
    END IF;
    IF v_rule.maximum_commission IS NOT NULL AND v_commission > v_rule.maximum_commission THEN
      v_commission := v_rule.maximum_commission;
    END IF;
  END IF;

  IF v_base = 0 THEN
    v_commission := 0;
  END IF;

  v_net := v_base - v_commission;

  INSERT INTO public.driver_wallets (driver_id)
  VALUES (v_driver_id)
  ON CONFLICT (driver_id) DO NOTHING;

  SELECT id INTO v_wallet_id FROM public.driver_wallets WHERE driver_id = v_driver_id;

  INSERT INTO public.commissions (
    delivery_request_id, driver_id, delivery_amount, commission_amount, driver_net_amount, rule_id
  ) VALUES (
    p_delivery_request_id, v_driver_id, v_base, v_commission, v_net, v_rule.id
  )
  RETURNING id INTO v_commission_id;

  UPDATE public.driver_wallets
  SET
    total_earned = total_earned + v_base,
    total_commission = total_commission + v_commission,
    commission_pending = commission_pending + v_commission,
    current_debt = current_debt + v_commission,
    updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description
  ) VALUES (
    v_wallet_id, 'earning', v_base,
    (SELECT total_earned FROM public.driver_wallets WHERE id = v_wallet_id),
    'delivery_request', p_delivery_request_id,
    'Ingreso por entrega'
  );

  IF v_commission > 0 THEN
    INSERT INTO public.wallet_transactions (
      wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description
    ) VALUES (
      v_wallet_id, 'commission', v_commission,
      (SELECT current_debt FROM public.driver_wallets WHERE id = v_wallet_id),
      'commission', v_commission_id,
      'Comisión plataforma'
    );
  END IF;

  PERFORM public.write_audit_log(
    'commission_applied',
    'commissions',
    v_commission_id,
    jsonb_build_object(
      'delivery_request_id', p_delivery_request_id,
      'base', v_base,
      'commission', v_commission
    )
  );

  RETURN v_commission_id;
END;
$$;

-- Enganchar comisión al marcar delivered
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

    -- Comisión de plataforma
    PERFORM public.apply_delivery_commission(p_delivery_request_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_wallet()
RETURNS TABLE (
  wallet_id UUID,
  total_earned NUMERIC,
  total_commission NUMERIC,
  commission_paid NUMERIC,
  commission_pending NUMERIC,
  current_debt NUMERIC,
  updated_at TIMESTAMPTZ
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

  INSERT INTO public.driver_wallets (driver_id)
  VALUES (v_driver_id)
  ON CONFLICT (driver_id) DO NOTHING;

  RETURN QUERY
  SELECT
    dw.id,
    dw.total_earned,
    dw.total_commission,
    dw.commission_paid,
    dw.commission_pending,
    dw.current_debt,
    dw.updated_at
  FROM public.driver_wallets dw
  WHERE dw.driver_id = v_driver_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_commission_payment(
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_payment_id UUID;
  v_debt NUMERIC;
BEGIN
  v_driver_id := public.get_my_driver_id();
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'No eres repartidor';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Monto inválido';
  END IF;

  SELECT current_debt INTO v_debt FROM public.driver_wallets WHERE driver_id = v_driver_id;
  IF COALESCE(v_debt, 0) <= 0 THEN
    RAISE EXCEPTION 'No tienes deuda de comisión pendiente';
  END IF;

  IF p_amount > v_debt THEN
    RAISE EXCEPTION 'El monto supera tu deuda actual (% )', v_debt;
  END IF;

  INSERT INTO public.payments (driver_id, amount, status, notes)
  VALUES (v_driver_id, p_amount, 'pending', NULLIF(trim(COALESCE(p_notes, '')), ''))
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_commission_payment(
  p_payment_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_wallet_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pago no encontrado';
  END IF;

  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'El pago ya fue revisado';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.payments
    SET status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = NOW(),
        notes = COALESCE(NULLIF(trim(COALESCE(p_notes, '')), ''), notes)
    WHERE id = p_payment_id;

    SELECT id INTO v_wallet_id FROM public.driver_wallets WHERE driver_id = v_payment.driver_id;

    UPDATE public.driver_wallets
    SET
      commission_paid = commission_paid + v_payment.amount,
      commission_pending = GREATEST(commission_pending - v_payment.amount, 0),
      current_debt = GREATEST(current_debt - v_payment.amount, 0),
      updated_at = NOW()
    WHERE id = v_wallet_id;

    INSERT INTO public.wallet_transactions (
      wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description, created_by
    ) VALUES (
      v_wallet_id, 'payment', v_payment.amount,
      (SELECT current_debt FROM public.driver_wallets WHERE id = v_wallet_id),
      'payment', p_payment_id,
      'Pago de comisión aprobado',
      auth.uid()
    );
  ELSIF p_action = 'reject' THEN
    UPDATE public.payments
    SET status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = NOW(),
        notes = COALESCE(NULLIF(trim(COALESCE(p_notes, '')), ''), notes)
    WHERE id = p_payment_id;
  ELSE
    RAISE EXCEPTION 'Acción inválida (approve|reject)';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_active_commission_percentage(
  p_percentage NUMERIC,
  p_minimum_commission NUMERIC DEFAULT 0,
  p_maximum_commission NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  IF p_percentage IS NULL OR p_percentage < 0 OR p_percentage > 1 THEN
    RAISE EXCEPTION 'Porcentaje inválido (usa 0.005 para 0.5%%)';
  END IF;

  UPDATE public.commission_rules SET is_active = FALSE WHERE is_active = TRUE;

  INSERT INTO public.commission_rules (
    name, percentage, minimum_commission, maximum_commission,
    grace_debt_limit, suspension_debt_limit, is_active
  )
  SELECT
    'Comisión PedidosGo',
    p_percentage,
    COALESCE(p_minimum_commission, 0),
    p_maximum_commission,
    COALESCE((SELECT grace_debt_limit FROM public.commission_rules ORDER BY created_at DESC LIMIT 1), 50000),
    COALESCE((SELECT suspension_debt_limit FROM public.commission_rules ORDER BY created_at DESC LIMIT 1), 100000),
    TRUE
  RETURNING id INTO v_id;

  UPDATE public.app_settings
  SET value = to_jsonb(p_percentage), updated_at = NOW()
  WHERE key = 'commission_percentage';

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_commission_rule() TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_delivery_commission(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_wallet() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_commission_payment(NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_commission_payment(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_active_commission_percentage(NUMERIC, NUMERIC, NUMERIC) TO authenticated;
