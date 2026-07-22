-- PedidosGo Fase 3: auth — roles al registrarse + helpers de sesión

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
BEGIN
  v_first_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'first_name', '')), '');
  v_last_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')), '');
  v_phone := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'phone', '')), '');
  v_role_slug := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'intended_role', '')), '');

  -- Nunca permitir auto-asignación de roles privilegiados
  IF v_role_slug IN ('super_admin', 'platform_admin', 'support_agent') THEN
    v_role_slug := NULL;
  END IF;

  -- Solo roles auto-asignables en registro público
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
      SELECT d.id, 'offline'
      FROM public.drivers d
      WHERE d.user_id = NEW.id
      ON CONFLICT (driver_id) DO NOTHING;

      INSERT INTO public.driver_wallets (driver_id)
      SELECT d.id
      FROM public.drivers d
      WHERE d.user_id = NEW.id
      ON CONFLICT (driver_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(r.slug ORDER BY r.slug),
    ARRAY[]::TEXT[]
  )
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.avatar_url,
    p.is_active
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Política: el usuario puede leer su propio perfil (ya existe); asegurar insert no público de roles
-- Los user_roles solo los escribe el trigger (security definer) o un admin
