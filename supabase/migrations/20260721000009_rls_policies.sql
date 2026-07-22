-- PedidosGo Fase 2: políticas RLS

-- PROFILES
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ROLES Y PERMISOS (lectura para UI; escritura solo admin)
CREATE POLICY roles_select ON public.roles
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY permissions_select ON public.permissions
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY role_permissions_select ON public.role_permissions
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY roles_admin_all ON public.roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY permissions_admin_all ON public.permissions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY role_permissions_admin_all ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- USER ROLES
CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY user_roles_admin_all ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- USER DEVICES
CREATE POLICY user_devices_own ON public.user_devices
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- USER SESSIONS AUDIT
CREATE POLICY user_sessions_audit_select ON public.user_sessions_audit
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY user_sessions_audit_insert ON public.user_sessions_audit
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- MERCHANTS
CREATE POLICY merchants_select ON public.merchants
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.user_belongs_to_merchant(id));

CREATE POLICY merchants_admin_write ON public.merchants
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- MERCHANT USERS
CREATE POLICY merchant_users_select ON public.merchant_users
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR public.user_belongs_to_merchant(merchant_id)
  );

CREATE POLICY merchant_users_admin_write ON public.merchant_users
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role('merchant_owner'))
  WITH CHECK (public.is_admin() OR public.has_role('merchant_owner'));

-- BRANCHES
CREATE POLICY branches_select ON public.branches
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.user_belongs_to_merchant(merchant_id));

CREATE POLICY branches_merchant_write ON public.branches
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(merchant_id)
      AND (public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(merchant_id)
      AND (public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
    )
  );

-- BRANCH SETTINGS / HOURS / ZONES
CREATE POLICY branch_settings_access ON public.branch_settings
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.user_belongs_to_branch(branch_id))
  WITH CHECK (public.is_admin() OR public.user_belongs_to_branch(branch_id));

CREATE POLICY branch_hours_access ON public.branch_hours
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR public.user_belongs_to_branch(branch_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.user_belongs_to_branch(branch_id)
  );

CREATE POLICY service_zones_access ON public.service_zones
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR public.user_belongs_to_branch(branch_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.user_belongs_to_branch(branch_id)
  );

-- API KEYS / WEBHOOKS (solo admin y owners)
CREATE POLICY merchant_api_keys_access ON public.merchant_api_keys
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(merchant_id)
      AND public.has_role('merchant_owner')
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(merchant_id)
      AND public.has_role('merchant_owner')
    )
  );

CREATE POLICY merchant_webhooks_access ON public.merchant_webhooks
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(merchant_id)
      AND (public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(merchant_id)
      AND (public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
    )
  );

-- DRIVERS
CREATE POLICY drivers_select ON public.drivers
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR public.has_role('support_agent')
  );

CREATE POLICY drivers_insert_own ON public.drivers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY drivers_update_own_or_admin ON public.drivers
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid())
  WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY driver_applications_access ON public.driver_applications
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY driver_documents_access ON public.driver_documents
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY driver_vehicles_access ON public.driver_vehicles
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY driver_devices_access ON public.driver_devices
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY driver_availability_access ON public.driver_availability
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
  )
  WITH CHECK (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
  );

CREATE POLICY driver_status_history_select ON public.driver_status_history
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
  );

CREATE POLICY driver_ratings_select ON public.driver_ratings
  FOR SELECT TO authenticated
  USING (public.is_admin() OR driver_id = public.get_my_driver_id());

CREATE POLICY driver_suspensions_admin ON public.driver_suspensions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ORDERS
CREATE POLICY orders_access ON public.orders
  FOR ALL TO authenticated
  USING (public.can_access_order(id))
  WITH CHECK (
    public.is_admin()
    OR public.user_belongs_to_branch(branch_id)
  );

CREATE POLICY order_items_access ON public.order_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND public.can_access_order(o.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (public.is_admin() OR public.user_belongs_to_branch(o.branch_id))
    )
  );

CREATE POLICY order_status_history_access ON public.order_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND public.can_access_order(o.id)
    )
  );

CREATE POLICY order_notes_access ON public.order_notes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND public.can_access_order(o.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (public.is_admin() OR public.user_belongs_to_branch(o.branch_id))
    )
  );

-- DELIVERY
CREATE POLICY delivery_requests_access ON public.delivery_requests
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR public.user_belongs_to_branch(branch_id)
    OR EXISTS (
      SELECT 1 FROM public.delivery_assignments da
      WHERE da.delivery_request_id = id
        AND da.driver_id = public.get_my_driver_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR public.user_belongs_to_branch(branch_id)
  );

CREATE POLICY delivery_offers_access ON public.delivery_offers
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
    OR EXISTS (
      SELECT 1 FROM public.delivery_requests dr
      WHERE dr.id = delivery_request_id
        AND public.user_belongs_to_branch(dr.branch_id)
    )
  )
  WITH CHECK (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
    OR EXISTS (
      SELECT 1 FROM public.delivery_requests dr
      WHERE dr.id = delivery_request_id
        AND public.user_belongs_to_branch(dr.branch_id)
    )
  );

CREATE POLICY delivery_assignments_access ON public.delivery_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
    OR EXISTS (
      SELECT 1 FROM public.delivery_requests dr
      WHERE dr.id = delivery_request_id
        AND public.user_belongs_to_branch(dr.branch_id)
    )
  );

-- UBICACIÓN
CREATE POLICY driver_current_locations_driver_write ON public.driver_current_locations
  FOR ALL TO authenticated
  USING (public.is_admin() OR driver_id = public.get_my_driver_id())
  WITH CHECK (public.is_admin() OR driver_id = public.get_my_driver_id());

CREATE POLICY driver_current_locations_merchant_read ON public.driver_current_locations
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
    OR EXISTS (
      SELECT 1
      FROM public.delivery_assignments da
      JOIN public.delivery_requests dr ON dr.id = da.delivery_request_id
      WHERE da.driver_id = driver_current_locations.driver_id
        AND public.user_belongs_to_branch(dr.branch_id)
        AND dr.status NOT IN ('delivered', 'cancelled', 'failed_delivery', 'returned')
    )
  );

CREATE POLICY driver_location_history_access ON public.driver_location_history
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
  );

CREATE POLICY driver_location_history_insert ON public.driver_location_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR driver_id = public.get_my_driver_id());

-- FINANZAS
CREATE POLICY driver_wallets_access ON public.driver_wallets
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
  );

CREATE POLICY wallet_transactions_access ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.driver_wallets dw
      WHERE dw.id = wallet_id AND dw.driver_id = public.get_my_driver_id()
    )
  );

CREATE POLICY commission_rules_select ON public.commission_rules
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY commission_rules_admin ON public.commission_rules
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY commissions_access ON public.commissions
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id = public.get_my_driver_id()
  );

CREATE POLICY payments_access ON public.payments
  FOR ALL TO authenticated
  USING (public.is_admin() OR driver_id = public.get_my_driver_id())
  WITH CHECK (public.is_admin() OR driver_id = public.get_my_driver_id());

-- NOTIFICACIONES
CREATE POLICY notifications_own ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY notification_preferences_own ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- SOPORTE
CREATE POLICY support_tickets_own ON public.support_tickets
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR public.has_role('support_agent')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_admin()
    OR public.has_role('support_agent')
  );

CREATE POLICY support_messages_access ON public.support_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id
        AND (
          st.user_id = auth.uid()
          OR public.is_admin()
          OR public.has_role('support_agent')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id
        AND (
          st.user_id = auth.uid()
          OR public.is_admin()
          OR public.has_role('support_agent')
        )
    )
  );

-- AUDITORÍA Y CONFIG
CREATE POLICY audit_logs_admin ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY app_settings_public_read ON public.app_settings
  FOR SELECT TO authenticated, anon
  USING (is_public = TRUE OR public.is_admin());

CREATE POLICY app_settings_admin_write ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY feature_flags_select ON public.feature_flags
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY feature_flags_admin ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY webhook_events_admin ON public.webhook_events
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY system_errors_admin ON public.system_errors
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CUSTOMERS (comercio y admin)
CREATE POLICY customers_access ON public.customers
  FOR ALL TO authenticated
  USING (public.is_admin() OR user_id = auth.uid())
  WITH CHECK (public.is_admin() OR user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY customer_addresses_access ON public.customer_addresses
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id AND c.user_id = auth.uid()
    )
  );
