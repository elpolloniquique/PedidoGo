-- PedidosGo Fase 4: flujo de solicitud del repartidor (RPCs seguros)

CREATE OR REPLACE FUNCTION public.guard_driver_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.is_admin() THEN
      IF NEW.status NOT IN ('draft', 'submitted') THEN
        RAISE EXCEPTION 'No autorizado a cambiar el estado a %', NEW.status;
      END IF;
      -- Estados cerrados por la plataforma
      IF OLD.status IN ('approved', 'suspended', 'blocked') THEN
        RAISE EXCEPTION 'No puedes modificar un estado cerrado';
      END IF;
    END IF;
  END IF;

  IF (NEW.approved_at IS DISTINCT FROM OLD.approved_at
      OR NEW.approved_by IS DISTINCT FROM OLD.approved_by)
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede registrar la aprobación';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_driver_status ON public.drivers;
CREATE TRIGGER trg_guard_driver_status
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_driver_status_change();

CREATE OR REPLACE FUNCTION public.submit_driver_application()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_app_id UUID;
  v_docs_count INTEGER;
  v_vehicle_count INTEGER;
  v_rut TEXT;
BEGIN
  SELECT id, rut INTO v_driver_id, v_rut
  FROM public.drivers
  WHERE user_id = auth.uid();

  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'No existe perfil de repartidor';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.drivers
    WHERE id = v_driver_id AND status IN ('approved', 'suspended', 'blocked')
  ) THEN
    RAISE EXCEPTION 'La solicitud ya no admite envío en este estado';
  END IF;

  IF v_rut IS NULL OR length(trim(v_rut)) < 8 THEN
    RAISE EXCEPTION 'Completa tus datos personales (RUT) antes de enviar';
  END IF;

  SELECT COUNT(*) INTO v_docs_count
  FROM public.driver_documents
  WHERE driver_id = v_driver_id;

  SELECT COUNT(*) INTO v_vehicle_count
  FROM public.driver_vehicles
  WHERE driver_id = v_driver_id;

  IF v_docs_count < 1 THEN
    RAISE EXCEPTION 'Debes subir al menos un documento';
  END IF;

  IF v_vehicle_count < 1 THEN
    RAISE EXCEPTION 'Debes registrar un vehículo';
  END IF;

  UPDATE public.drivers
  SET status = 'submitted', updated_at = NOW()
  WHERE id = v_driver_id
    AND user_id = auth.uid();

  INSERT INTO public.driver_applications (
    driver_id, status, submitted_at, updated_at
  )
  VALUES (v_driver_id, 'submitted', NOW(), NOW())
  RETURNING id INTO v_app_id;

  PERFORM public.write_audit_log(
    'driver_application_submitted',
    'driver_applications',
    v_app_id,
    jsonb_build_object('driver_id', v_driver_id)
  );

  RETURN v_app_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_driver_application(
  p_driver_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.driver_application_status;
  v_app_id UUID;
  v_prev_submitted TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores pueden revisar solicitudes';
  END IF;

  IF p_action = 'approve' THEN
    v_status := 'approved';
  ELSIF p_action = 'reject' THEN
    v_status := 'rejected';
  ELSIF p_action = 'changes_required' THEN
    v_status := 'changes_required';
  ELSIF p_action = 'under_review' THEN
    v_status := 'under_review';
  ELSE
    RAISE EXCEPTION 'Acción no válida: %', p_action;
  END IF;

  UPDATE public.drivers
  SET
    status = v_status,
    approved_at = CASE WHEN v_status = 'approved' THEN NOW() ELSE approved_at END,
    approved_by = CASE WHEN v_status = 'approved' THEN auth.uid() ELSE approved_by END,
    updated_at = NOW()
  WHERE id = p_driver_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repartidor no encontrado';
  END IF;

  SELECT submitted_at INTO v_prev_submitted
  FROM public.driver_applications
  WHERE driver_id = p_driver_id
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO public.driver_applications (
    driver_id, status, submitted_at, reviewed_at, reviewed_by, reviewer_notes, updated_at
  )
  VALUES (
    p_driver_id,
    v_status,
    COALESCE(v_prev_submitted, NOW()),
    NOW(),
    auth.uid(),
    p_notes,
    NOW()
  )
  RETURNING id INTO v_app_id;

  PERFORM public.write_audit_log(
    'driver_application_reviewed',
    'driver_applications',
    v_app_id,
    jsonb_build_object(
      'driver_id', p_driver_id,
      'action', p_action,
      'status', v_status
    )
  );

  RETURN v_app_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_driver_application() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_driver_application(UUID, TEXT, TEXT) TO authenticated;
