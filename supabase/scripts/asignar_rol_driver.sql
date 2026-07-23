-- Asigna rol driver + filas operativas a un usuario existente (por email).
-- Usá esto si al login aparece: "Tu cuenta no tiene permiso para esta aplicación."

DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
  v_driver_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower('tutacanehuillca@gmail.com')
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Perfil (por si faltara)
  INSERT INTO public.profiles (id, email, first_name, last_name)
  SELECT
    u.id,
    u.email,
    NULLIF(trim(COALESCE(u.raw_user_meta_data ->> 'first_name', '')), ''),
    NULLIF(trim(COALESCE(u.raw_user_meta_data ->> 'last_name', '')), '')
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();

  SELECT id INTO v_role_id FROM public.roles WHERE slug = 'driver' LIMIT 1;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Rol driver no existe en public.roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  INSERT INTO public.drivers (user_id, status)
  VALUES (v_user_id, 'draft')
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_driver_id;

  IF v_driver_id IS NULL THEN
    SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = v_user_id;
  END IF;

  INSERT INTO public.driver_availability (driver_id, status)
  VALUES (v_driver_id, 'offline')
  ON CONFLICT (driver_id) DO NOTHING;

  INSERT INTO public.driver_wallets (driver_id)
  VALUES (v_driver_id)
  ON CONFLICT (driver_id) DO NOTHING;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Verificar:
SELECT
  u.email,
  p.first_name,
  array_agg(r.slug) AS roles,
  d.id AS driver_id,
  d.status AS driver_status
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
LEFT JOIN public.drivers d ON d.user_id = u.id
WHERE u.email = lower('tutacanehuillca@gmail.com')
GROUP BY u.email, p.first_name, d.id, d.status;
