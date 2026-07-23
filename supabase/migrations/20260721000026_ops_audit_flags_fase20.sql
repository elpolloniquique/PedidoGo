-- PedidosGo Fase 20: operación avanzada — auditoría, feature flags, errores

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
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
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    left(trim(COALESCE(p_action, 'unknown')), 120),
    left(trim(COALESCE(p_entity_type, 'system')), 80),
    p_entity_id,
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_audit_logs(p_limit INTEGER DEFAULT 80)
RETURNS TABLE (
  id UUID,
  actor_id UUID,
  actor_email TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 80), 1), 200);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.actor_id,
    p.email,
    a.action,
    a.entity_type,
    a.entity_id,
    a.metadata,
    a.created_at
  FROM public.audit_logs a
  LEFT JOIN public.profiles p ON p.id = a.actor_id
  ORDER BY a.created_at DESC
  LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_feature_flags()
RETURNS TABLE (
  id UUID,
  key TEXT,
  enabled BOOLEAN,
  description TEXT,
  metadata JSONB,
  updated_at TIMESTAMPTZ
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
  SELECT f.id, f.key, f.enabled, f.description, f.metadata, f.updated_at
  FROM public.feature_flags f
  ORDER BY f.key;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_feature_flag(
  p_key TEXT,
  p_enabled BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_prev BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  SELECT id, enabled INTO v_id, v_prev
  FROM public.feature_flags
  WHERE key = trim(p_key);

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Flag no encontrado: %', p_key;
  END IF;

  UPDATE public.feature_flags
  SET enabled = COALESCE(p_enabled, FALSE),
      updated_at = NOW()
  WHERE id = v_id;

  PERFORM public.write_audit_log(
    'feature_flag.toggle',
    'feature_flags',
    v_id,
    jsonb_build_object('key', p_key, 'from', v_prev, 'to', p_enabled)
  );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_system_errors(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  source TEXT,
  message TEXT,
  stack_trace TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  RETURN QUERY
  SELECT e.id, e.source, e.message, e.stack_trace, e.metadata, e.created_at
  FROM public.system_errors e
  ORDER BY e.created_at DESC
  LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_app_settings_admin()
RETURNS TABLE (
  id UUID,
  key TEXT,
  value TEXT,
  description TEXT,
  is_public BOOLEAN,
  updated_at TIMESTAMPTZ
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
  SELECT s.id, s.key, s.value, s.description, s.is_public, s.updated_at
  FROM public.app_settings s
  ORDER BY s.key;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_app_setting(
  p_key TEXT,
  p_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_prev TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  SELECT id, value INTO v_id, v_prev
  FROM public.app_settings
  WHERE key = trim(p_key);

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Setting no encontrado: %', p_key;
  END IF;

  UPDATE public.app_settings
  SET value = COALESCE(p_value, ''),
      updated_by = auth.uid(),
      updated_at = NOW()
  WHERE id = v_id;

  PERFORM public.write_audit_log(
    'app_setting.update',
    'app_settings',
    v_id,
    jsonb_build_object('key', p_key, 'from', v_prev, 'to', p_value)
  );

  RETURN TRUE;
END;
$$;

-- Flags útiles si faltan
INSERT INTO public.feature_flags (key, enabled, description)
VALUES
  ('public_tracking', TRUE, 'Tracking público de pedidos'),
  ('require_delivery_evidence', TRUE, 'Exigir foto antes de marcar entregado'),
  ('webhooks_enabled', TRUE, 'Encolar y despachar webhooks de comercio'),
  ('support_tickets_enabled', TRUE, 'Módulo de tickets de soporte')
ON CONFLICT (key) DO NOTHING;

GRANT EXECUTE ON FUNCTION public.write_audit_log(TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_audit_logs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_feature_flags() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_feature_flag(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_system_errors(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_app_settings_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_app_setting(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.list_audit_logs(INTEGER) IS 'Fase 20: bitácora para admin.';
COMMENT ON FUNCTION public.set_feature_flag(TEXT, BOOLEAN) IS 'Fase 20: activar/desactivar feature flags.';
