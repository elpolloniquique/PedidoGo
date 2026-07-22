-- PedidosGo Fase 6: comercios — membresía, bootstrap y RLS de edición

-- Owner/admin del comercio pueden actualizar su merchant (no crear vía INSERT directo)
DROP POLICY IF EXISTS merchants_owner_update ON public.merchants;
CREATE POLICY merchants_owner_update ON public.merchants
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(id)
      AND (
        public.has_role('merchant_owner')
        OR public.has_role('merchant_admin')
      )
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(id)
      AND (
        public.has_role('merchant_owner')
        OR public.has_role('merchant_admin')
      )
    )
  );

CREATE OR REPLACE FUNCTION public.get_my_merchant_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(mu.merchant_id), ARRAY[]::UUID[])
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid()
    AND mu.is_active = TRUE;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_my_merchant(
  p_name TEXT DEFAULT 'Mi comercio'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v_branch_id UUID;
BEGIN
  IF NOT (
    public.has_role('merchant_owner')
    OR public.has_role('merchant_admin')
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Solo dueños de comercio pueden crear un comercio';
  END IF;

  SELECT mu.merchant_id INTO v_merchant_id
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid()
    AND mu.is_active = TRUE
  LIMIT 1;

  IF v_merchant_id IS NOT NULL THEN
    RETURN v_merchant_id;
  END IF;

  INSERT INTO public.merchants (name, is_active, is_approved, approved_at)
  VALUES (COALESCE(NULLIF(trim(p_name), ''), 'Mi comercio'), TRUE, TRUE, NOW())
  RETURNING id INTO v_merchant_id;

  INSERT INTO public.merchant_users (merchant_id, user_id, role, is_active)
  VALUES (v_merchant_id, auth.uid(), 'owner', TRUE);

  INSERT INTO public.branches (
    merchant_id, name, code, address_line, city, commune, region, is_active
  )
  VALUES (
    v_merchant_id,
    'Sucursal principal',
    'SUC-01',
    'Dirección por configurar',
    'Santiago',
    'Santiago',
    'Región Metropolitana',
    TRUE
  )
  RETURNING id INTO v_branch_id;

  INSERT INTO public.branch_settings (branch_id, delivery_dispatch_mode)
  VALUES (v_branch_id, 'manual')
  ON CONFLICT (branch_id) DO NOTHING;

  INSERT INTO public.branch_hours (branch_id, day_of_week, opens_at, closes_at, is_closed)
  SELECT v_branch_id, d, TIME '10:00', TIME '22:00', FALSE
  FROM generate_series(0, 6) AS d
  ON CONFLICT (branch_id, day_of_week) DO NOTHING;

  PERFORM public.write_audit_log(
    'merchant_bootstrapped',
    'merchants',
    v_merchant_id,
    jsonb_build_object('branch_id', v_branch_id)
  );

  RETURN v_merchant_id;
END;
$$;

-- Vincular al comercio semilla El Pollón si el usuario aún no pertenece a ninguno
CREATE OR REPLACE FUNCTION public.link_demo_merchant_el_pollon()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID := 'a1000000-0000-4000-8000-000000000001';
  v_existing UUID;
BEGIN
  IF NOT (
    public.has_role('merchant_owner')
    OR public.has_role('merchant_admin')
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Rol de comercio requerido';
  END IF;

  SELECT mu.merchant_id INTO v_existing
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid() AND mu.is_active = TRUE
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.merchants WHERE id = v_merchant_id) THEN
    RAISE EXCEPTION 'Comercio demo El Pollón no existe. Ejecuta seed.sql';
  END IF;

  INSERT INTO public.merchant_users (merchant_id, user_id, role, is_active)
  VALUES (v_merchant_id, auth.uid(), 'owner', TRUE)
  ON CONFLICT (merchant_id, user_id) DO UPDATE
    SET is_active = TRUE,
        role = 'owner';

  PERFORM public.write_audit_log(
    'merchant_linked_demo',
    'merchants',
    v_merchant_id,
    '{}'::jsonb
  );

  RETURN v_merchant_id;
END;
$$;

-- Ampliar trigger de registro: crear comercio básico para merchant_owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_slug TEXT;
  v_role_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
  v_merchant_id UUID;
  v_branch_id UUID;
BEGIN
  v_first_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'first_name', '')), '');
  v_last_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')), '');
  v_phone := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'phone', '')), '');
  v_role_slug := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'intended_role', '')), '');

  IF v_role_slug IN ('super_admin', 'platform_admin', 'support_agent') THEN
    v_role_slug := NULL;
  END IF;

  IF v_role_slug IS NOT NULL AND v_role_slug NOT IN ('driver', 'merchant_owner', 'customer') THEN
    v_role_slug := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, phone)
  VALUES (NEW.id, NEW.email, v_first_name, v_last_name, v_phone)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = NOW();

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_role_slug IS NOT NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE slug = v_role_slug LIMIT 1;

    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (NEW.id, v_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    IF v_role_slug = 'driver' THEN
      INSERT INTO public.drivers (user_id, status)
      VALUES (NEW.id, 'draft')
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO public.driver_availability (driver_id, status)
      SELECT d.id, 'offline' FROM public.drivers d WHERE d.user_id = NEW.id
      ON CONFLICT (driver_id) DO NOTHING;

      INSERT INTO public.driver_wallets (driver_id)
      SELECT d.id FROM public.drivers d WHERE d.user_id = NEW.id
      ON CONFLICT (driver_id) DO NOTHING;
    END IF;

    IF v_role_slug = 'merchant_owner' THEN
      INSERT INTO public.merchants (name, email, is_active, is_approved, approved_at)
      VALUES (
        COALESCE(NULLIF(trim(COALESCE(v_first_name, '') || ' ' || COALESCE(v_last_name, '')), ''), 'Mi comercio'),
        NEW.email,
        TRUE,
        TRUE,
        NOW()
      )
      RETURNING id INTO v_merchant_id;

      INSERT INTO public.merchant_users (merchant_id, user_id, role, is_active)
      VALUES (v_merchant_id, NEW.id, 'owner', TRUE);

      INSERT INTO public.branches (
        merchant_id, name, code, address_line, city, commune, region, is_active
      ) VALUES (
        v_merchant_id, 'Sucursal principal', 'SUC-01',
        'Dirección por configurar', 'Santiago', 'Santiago', 'Región Metropolitana', TRUE
      )
      RETURNING id INTO v_branch_id;

      INSERT INTO public.branch_settings (branch_id, delivery_dispatch_mode)
      VALUES (v_branch_id, 'manual');

      INSERT INTO public.branch_hours (branch_id, day_of_week, opens_at, closes_at, is_closed)
      SELECT v_branch_id, d, TIME '10:00', TIME '22:00', FALSE
      FROM generate_series(0, 6) AS d;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Vincular usuario existente al comercio por correo (evita RLS de profiles)
CREATE OR REPLACE FUNCTION public.link_merchant_user_by_email(
  p_email TEXT,
  p_role public.merchant_user_role DEFAULT 'operator',
  p_branch_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v_my_role public.merchant_user_role;
  v_user_id UUID;
  v_member_id UUID;
BEGIN
  IF p_role NOT IN ('admin', 'operator') THEN
    RAISE EXCEPTION 'Solo se pueden asignar roles admin u operator';
  END IF;

  SELECT mu.merchant_id, mu.role INTO v_merchant_id, v_my_role
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid()
    AND mu.is_active = TRUE
  LIMIT 1;

  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'No perteneces a un comercio';
  END IF;

  IF v_my_role NOT IN ('owner', 'admin') AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sin permiso para agregar usuarios';
  END IF;

  IF p_branch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id = p_branch_id AND b.merchant_id = v_merchant_id
  ) THEN
    RAISE EXCEPTION 'Sucursal no pertenece a tu comercio';
  END IF;

  SELECT p.id INTO v_user_id
  FROM public.profiles p
  WHERE lower(p.email) = lower(trim(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuario registrado con ese correo';
  END IF;

  INSERT INTO public.merchant_users (merchant_id, user_id, role, branch_id, is_active)
  VALUES (v_merchant_id, v_user_id, p_role, p_branch_id, TRUE)
  ON CONFLICT (merchant_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        branch_id = EXCLUDED.branch_id,
        is_active = TRUE,
        updated_at = NOW()
  RETURNING id INTO v_member_id;

  PERFORM public.write_audit_log(
    'merchant_user_linked',
    'merchant_users',
    v_member_id,
    jsonb_build_object('email', p_email, 'role', p_role)
  );

  RETURN v_member_id;
END;
$$;

-- Listar miembros con datos de perfil (SECURITY DEFINER por RLS de profiles)
CREATE OR REPLACE FUNCTION public.list_my_merchant_members()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  role public.merchant_user_role,
  branch_id UUID,
  is_active BOOLEAN,
  email TEXT,
  first_name TEXT,
  last_name TEXT
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
  WHERE mu.user_id = auth.uid()
    AND mu.is_active = TRUE
  LIMIT 1;

  IF v_merchant_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    mu.id,
    mu.user_id,
    mu.role,
    mu.branch_id,
    mu.is_active,
    p.email,
    p.first_name,
    p.last_name
  FROM public.merchant_users mu
  JOIN public.profiles p ON p.id = mu.user_id
  WHERE mu.merchant_id = v_merchant_id
  ORDER BY mu.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_merchant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_my_merchant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_demo_merchant_el_pollon() TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_merchant_user_by_email(TEXT, public.merchant_user_role, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_merchant_members() TO authenticated;
