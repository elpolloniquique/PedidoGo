-- PedidosGo Fase 21: API keys comercio + preferencias de notificación + reportes

-- ---------------------------------------------------------------------------
-- API keys
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_merchant_api_key(
  p_name TEXT DEFAULT 'default'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v_raw TEXT;
  v_prefix TEXT;
  v_hash TEXT;
  v_id UUID;
  v_name TEXT := left(trim(COALESCE(NULLIF(p_name, ''), 'default')), 80);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT mu.merchant_id INTO v_merchant_id
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid() AND mu.is_active = TRUE
  ORDER BY mu.created_at
  LIMIT 1;

  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Sin comercio asociado';
  END IF;

  IF NOT (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(v_merchant_id)
      AND (public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  v_raw := 'rx_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_prefix := left(v_raw, 10);
  v_hash := encode(extensions.digest(v_raw, 'sha256'), 'hex');

  INSERT INTO public.merchant_api_keys (
    merchant_id, name, key_prefix, key_hash, is_active, created_by
  )
  VALUES (v_merchant_id, v_name, v_prefix, v_hash, TRUE, auth.uid())
  RETURNING id INTO v_id;

  PERFORM public.write_audit_log(
    'api_key.create',
    'merchant_api_keys',
    v_id,
    jsonb_build_object('merchant_id', v_merchant_id, 'name', v_name, 'prefix', v_prefix)
  );

  RETURN jsonb_build_object(
    'id', v_id,
    'name', v_name,
    'prefix', v_prefix,
    'api_key', v_raw
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_merchant_api_keys()
RETURNS TABLE (
  id UUID,
  name TEXT,
  key_prefix TEXT,
  is_active BOOLEAN,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
BEGIN
  SELECT mu.merchant_id INTO v_merchant_id
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid() AND mu.is_active = TRUE
  ORDER BY mu.created_at
  LIMIT 1;

  IF v_merchant_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT k.id, k.name, k.key_prefix, k.is_active, k.last_used_at, k.created_at
  FROM public.merchant_api_keys k
  WHERE k.merchant_id = v_merchant_id
  ORDER BY k.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_merchant_api_key(p_key_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
BEGIN
  SELECT merchant_id INTO v_merchant_id
  FROM public.merchant_api_keys
  WHERE id = p_key_id;

  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'API key no encontrada';
  END IF;

  IF NOT (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(v_merchant_id)
      AND (public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.merchant_api_keys
  SET is_active = FALSE
  WHERE id = p_key_id;

  PERFORM public.write_audit_log(
    'api_key.revoke',
    'merchant_api_keys',
    p_key_id,
    jsonb_build_object('merchant_id', v_merchant_id)
  );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_merchant_api_key(p_api_key TEXT)
RETURNS TABLE (
  key_id UUID,
  merchant_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  IF NULLIF(trim(COALESCE(p_api_key, '')), '') IS NULL THEN
    RETURN;
  END IF;

  v_hash := encode(extensions.digest(trim(p_api_key), 'sha256'), 'hex');

  RETURN QUERY
  UPDATE public.merchant_api_keys k
  SET last_used_at = NOW()
  WHERE k.key_hash = v_hash
    AND k.is_active = TRUE
  RETURNING k.id, k.merchant_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Preferencias de notificación
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_notification_preferences()
RETURNS TABLE (
  email_enabled BOOLEAN,
  in_app_enabled BOOLEAN,
  sound_enabled BOOLEAN,
  vibration_enabled BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY
  SELECT np.email_enabled, np.in_app_enabled, np.sound_enabled, np.vibration_enabled, np.updated_at
  FROM public.notification_preferences np
  WHERE np.user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.set_my_notification_preferences(
  p_email_enabled BOOLEAN DEFAULT NULL,
  p_in_app_enabled BOOLEAN DEFAULT NULL,
  p_sound_enabled BOOLEAN DEFAULT NULL,
  p_vibration_enabled BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.notification_preferences
  SET
    email_enabled = COALESCE(p_email_enabled, email_enabled),
    in_app_enabled = COALESCE(p_in_app_enabled, in_app_enabled),
    sound_enabled = COALESCE(p_sound_enabled, sound_enabled),
    vibration_enabled = COALESCE(p_vibration_enabled, vibration_enabled),
    updated_at = NOW()
  WHERE user_id = auth.uid();

  RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------------
-- Reportes admin (JSON para CSV en app)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.export_admin_orders_report(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  merchant_name TEXT,
  status TEXT,
  total NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    m.name,
    o.status::TEXT,
    o.total,
    o.created_at,
    o.updated_at
  FROM public.orders o
  JOIN public.merchants m ON m.id = o.merchant_id
  WHERE o.created_at >= NOW() - make_interval(days => v_days)
  ORDER BY o.created_at DESC
  LIMIT 5000;
END;
$$;

CREATE OR REPLACE FUNCTION public.export_admin_drivers_report()
RETURNS TABLE (
  driver_id UUID,
  email TEXT,
  status TEXT,
  average_rating NUMERIC,
  completed_deliveries INTEGER,
  availability TEXT,
  created_at TIMESTAMPTZ
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
    d.id,
    p.email,
    d.status::TEXT,
    d.average_rating,
    d.completed_deliveries,
    COALESCE(da.status::TEXT, 'offline'),
    d.created_at
  FROM public.drivers d
  JOIN public.profiles p ON p.id = d.user_id
  LEFT JOIN public.driver_availability da ON da.driver_id = d.id
  ORDER BY d.created_at DESC
  LIMIT 5000;
END;
$$;

CREATE OR REPLACE FUNCTION public.export_admin_payments_report(p_days INTEGER DEFAULT 90)
RETURNS TABLE (
  payment_id UUID,
  driver_id UUID,
  amount NUMERIC,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER := LEAST(GREATEST(COALESCE(p_days, 90), 1), 365);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  RETURN QUERY
  SELECT pay.id, pay.driver_id, pay.amount, pay.status, pay.notes, pay.created_at
  FROM public.payments pay
  WHERE pay.created_at >= NOW() - make_interval(days => v_days)
  ORDER BY pay.created_at DESC
  LIMIT 5000;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_merchant_api_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_merchant_api_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_merchant_api_key(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_merchant_api_key(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_notification_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_notification_preferences(BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_admin_orders_report(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_admin_drivers_report() TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_admin_payments_report(INTEGER) TO authenticated;
