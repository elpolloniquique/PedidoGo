-- PedidosGo Fase 2: funciones auxiliares, triggers y auditoría

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.has_role(p_role_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.slug = p_role_slug
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('super_admin') OR public.has_role('platform_admin');
$$;

CREATE OR REPLACE FUNCTION public.get_my_driver_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id
  FROM public.drivers d
  WHERE d.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_merchant(p_merchant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.merchant_users mu
      WHERE mu.user_id = auth.uid()
        AND mu.merchant_id = p_merchant_id
        AND mu.is_active = TRUE
    );
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_branch(p_branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.merchant_users mu
      JOIN public.branches b ON b.merchant_id = mu.merchant_id
      WHERE mu.user_id = auth.uid()
        AND b.id = p_branch_id
        AND mu.is_active = TRUE
        AND (
          mu.branch_id IS NULL
          OR mu.branch_id = p_branch_id
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = p_order_id
        AND public.user_belongs_to_merchant(o.merchant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.delivery_assignments da
      JOIN public.delivery_requests dr ON dr.id = da.delivery_request_id
      WHERE dr.order_id = p_order_id
        AND da.driver_id = public.get_my_driver_id()
    );
$$;

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
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::JSONB))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Triggers updated_at en tablas principales
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_delivery_requests_updated_at
  BEFORE UPDATE ON public.delivery_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_driver_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_merchant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_branch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.write_audit_log(TEXT, TEXT, UUID, JSONB) TO authenticated;
