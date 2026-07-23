-- Activa CUALQUIER cuenta de comercio por email (confirmación + rol + comercio).
-- Cambiá solo la línea v_email.

DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
  v_merchant_id UUID;
  v_branch_id UUID;
  v_email TEXT := lower('usolibretrabajos@gmail.com'); -- << cambiá este correo
  v_name TEXT;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: %. Primero registrate en /register aunque diga revisar correo.', v_email;
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = v_user_id;

  SELECT
    COALESCE(
      NULLIF(trim(
        COALESCE(raw_user_meta_data ->> 'first_name', '') || ' ' ||
        COALESCE(raw_user_meta_data ->> 'last_name', '')
      ), ''),
      split_part(v_email, '@', 1),
      'Mi comercio'
    )
  INTO v_name
  FROM auth.users
  WHERE id = v_user_id;

  INSERT INTO public.profiles (id, email, first_name, last_name, phone)
  SELECT
    u.id,
    u.email,
    NULLIF(trim(COALESCE(u.raw_user_meta_data ->> 'first_name', '')), ''),
    NULLIF(trim(COALESCE(u.raw_user_meta_data ->> 'last_name', '')), ''),
    NULLIF(trim(COALESCE(u.raw_user_meta_data ->> 'phone', '')), '')
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = NOW();

  SELECT id INTO v_role_id FROM public.roles WHERE slug = 'merchant_owner' LIMIT 1;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Rol merchant_owner no existe';
  END IF;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  SELECT mu.merchant_id INTO v_merchant_id
  FROM public.merchant_users mu
  WHERE mu.user_id = v_user_id AND mu.is_active = TRUE
  LIMIT 1;

  IF v_merchant_id IS NULL THEN
    INSERT INTO public.merchants (name, email, is_active, is_approved, approved_at)
    VALUES (v_name, v_email, TRUE, TRUE, NOW())
    RETURNING id INTO v_merchant_id;

    INSERT INTO public.merchant_users (merchant_id, user_id, role, is_active)
    VALUES (v_merchant_id, v_user_id, 'owner', TRUE);

    INSERT INTO public.branches (
      merchant_id, name, code, address_line, city, commune, region, is_active
    ) VALUES (
      v_merchant_id, 'Sucursal principal', 'SUC-01',
      'Dirección por configurar', 'Santiago', 'Santiago', 'Región Metropolitana', TRUE
    )
    RETURNING id INTO v_branch_id;

    INSERT INTO public.branch_settings (branch_id, delivery_dispatch_mode)
    VALUES (v_branch_id, 'manual')
    ON CONFLICT (branch_id) DO NOTHING;

    INSERT INTO public.branch_hours (branch_id, day_of_week, opens_at, closes_at, is_closed)
    SELECT v_branch_id, d, TIME '10:00', TIME '22:00', FALSE
    FROM generate_series(0, 6) AS d
    ON CONFLICT (branch_id, day_of_week) DO NOTHING;
  END IF;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END $$;

SELECT
  u.email,
  u.email_confirmed_at IS NOT NULL AS email_ok,
  array_agg(DISTINCT r.slug) AS roles,
  m.name AS comercio
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
LEFT JOIN public.merchant_users mu ON mu.user_id = u.id AND mu.is_active
LEFT JOIN public.merchants m ON m.id = mu.merchant_id
WHERE u.email = lower('usolibretrabajos@gmail.com')
GROUP BY u.email, u.email_confirmed_at, m.name;
