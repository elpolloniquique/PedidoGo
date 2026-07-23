-- Aprobar un repartidor por ID (admin / emergencia).
-- Reemplazá el UUID si hace falta.

DO $$
DECLARE
  v_driver_id UUID := 'fc92ba4b-c44f-4d79-871c-fc5a494808f8'::uuid;
  v_admin_id UUID;
BEGIN
  SELECT ur.user_id INTO v_admin_id
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE r.slug IN ('super_admin', 'platform_admin')
  LIMIT 1;

  UPDATE public.drivers
  SET
    status = 'approved',
    approved_at = NOW(),
    approved_by = COALESCE(v_admin_id, approved_by),
    updated_at = NOW()
  WHERE id = v_driver_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repartidor no encontrado: %', v_driver_id;
  END IF;

  INSERT INTO public.driver_applications (
    driver_id, status, submitted_at, reviewed_at, reviewed_by, reviewer_notes, updated_at
  )
  VALUES (
    v_driver_id,
    'approved',
    NOW(),
    NOW(),
    v_admin_id,
    'Aprobado por SQL (emergencia)',
    NOW()
  );
END $$;

SELECT id, status, approved_at, approved_by
FROM public.drivers
WHERE id = 'fc92ba4b-c44f-4d79-871c-fc5a494808f8';
