-- PedidosGo Fase 18: webhooks de comercio + tickets de soporte (RPCs + políticas)

-- ---------------------------------------------------------------------------
-- Webhooks: secreto usable para firma HMAC
-- ---------------------------------------------------------------------------
ALTER TABLE public.merchant_webhooks
  ADD COLUMN IF NOT EXISTS secret TEXT;

COMMENT ON COLUMN public.merchant_webhooks.secret IS
  'Secreto compartido para firmar entregas (X-RapideX-Signature). Mostrar solo al crear.';

-- Eventos: el comercio puede ver los suyos
DROP POLICY IF EXISTS webhook_events_admin ON public.webhook_events;
CREATE POLICY webhook_events_access ON public.webhook_events
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      merchant_id IS NOT NULL
      AND public.user_belongs_to_merchant(merchant_id)
      AND (public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
    )
  );

CREATE POLICY webhook_events_admin_write ON public.webhook_events
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Helpers webhooks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_merchant_webhook(
  p_url TEXT,
  p_events TEXT[] DEFAULT ARRAY['order.status_changed']::TEXT[],
  p_branch_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v_url TEXT := trim(COALESCE(p_url, ''));
  v_secret TEXT;
  v_id UUID;
  v_events TEXT[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT mu.merchant_id INTO v_merchant_id
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid()
    AND mu.is_active = TRUE
  ORDER BY mu.created_at
  LIMIT 1;

  IF v_merchant_id IS NULL AND NOT public.is_admin() THEN
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

  IF v_url !~* '^https://' THEN
    RAISE EXCEPTION 'La URL del webhook debe usar HTTPS';
  END IF;

  v_events := COALESCE(NULLIF(p_events, '{}'::TEXT[]), ARRAY['order.status_changed']::TEXT[]);
  v_secret := encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO public.merchant_webhooks (
    merchant_id, branch_id, url, secret, secret_hash, events, is_active
  )
  VALUES (
    v_merchant_id,
    p_branch_id,
    v_url,
    v_secret,
    left(encode(extensions.digest(v_secret, 'sha256'), 'hex'), 12),
    v_events,
    TRUE
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'id', v_id,
    'url', v_url,
    'events', to_jsonb(v_events),
    'secret', v_secret,
    'secret_hint', left(v_secret, 6) || '…'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_merchant_webhooks()
RETURNS TABLE (
  id UUID,
  url TEXT,
  events TEXT[],
  is_active BOOLEAN,
  secret_hint TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_merchant_id UUID;
BEGIN
  SELECT mu.merchant_id INTO v_merchant_id
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid()
    AND mu.is_active = TRUE
  ORDER BY mu.created_at
  LIMIT 1;

  IF v_merchant_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    w.id,
    w.url,
    w.events,
    w.is_active,
    CASE
      WHEN w.secret IS NOT NULL THEN left(w.secret, 6) || '…'
      ELSE COALESCE(w.secret_hash, '—')
    END,
    w.created_at,
    w.updated_at
  FROM public.merchant_webhooks w
  WHERE w.merchant_id = v_merchant_id
  ORDER BY w.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_merchant_webhook_active(
  p_webhook_id UUID,
  p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
BEGIN
  SELECT merchant_id INTO v_merchant_id
  FROM public.merchant_webhooks
  WHERE id = p_webhook_id;

  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Webhook no encontrado';
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

  UPDATE public.merchant_webhooks
  SET is_active = COALESCE(p_active, FALSE),
      updated_at = NOW()
  WHERE id = p_webhook_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_merchant_webhook(p_webhook_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
BEGIN
  SELECT merchant_id INTO v_merchant_id
  FROM public.merchant_webhooks
  WHERE id = p_webhook_id;

  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Webhook no encontrado';
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

  DELETE FROM public.merchant_webhooks WHERE id = p_webhook_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_webhook_event(
  p_merchant_id UUID,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_has_hook BOOLEAN;
BEGIN
  IF p_merchant_id IS NULL OR NULLIF(trim(COALESCE(p_event_type, '')), '') IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.merchant_webhooks w
    WHERE w.merchant_id = p_merchant_id
      AND w.is_active = TRUE
      AND (
        p_event_type = ANY (w.events)
        OR 'order.status_changed' = ANY (w.events)
        OR '*' = ANY (w.events)
      )
  )
  INTO v_has_hook;

  IF NOT v_has_hook THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.webhook_events (merchant_id, event_type, payload, status)
  VALUES (
    p_merchant_id,
    trim(p_event_type),
    COALESCE(p_payload, '{}'::JSONB),
    'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_merchant_webhook_events(p_limit INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  status TEXT,
  attempts INTEGER,
  last_error TEXT,
  created_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_merchant_id UUID;
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 100);
BEGIN
  SELECT mu.merchant_id INTO v_merchant_id
  FROM public.merchant_users mu
  WHERE mu.user_id = auth.uid()
    AND mu.is_active = TRUE
  ORDER BY mu.created_at
  LIMIT 1;

  IF v_merchant_id IS NULL AND NOT public.is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.event_type,
    e.status,
    e.attempts,
    e.last_error,
    e.created_at,
    e.processed_at
  FROM public.webhook_events e
  WHERE e.merchant_id = COALESCE(v_merchant_id, e.merchant_id)
    AND (public.is_admin() OR e.merchant_id = v_merchant_id)
  ORDER BY e.created_at DESC
  LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_pending_webhook_deliveries(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  event_id UUID,
  merchant_id UUID,
  event_type TEXT,
  payload JSONB,
  webhook_id UUID,
  url TEXT,
  secret TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
BEGIN
  IF NOT (
    public.is_admin()
    OR public.has_role('merchant_owner')
    OR public.has_role('merchant_admin')
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  WITH pending AS (
    SELECT e.id
    FROM public.webhook_events e
    WHERE e.status = 'pending'
      AND (
        public.is_admin()
        OR public.user_belongs_to_merchant(e.merchant_id)
      )
    ORDER BY e.created_at
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  SELECT
    e.id,
    e.merchant_id,
    e.event_type,
    e.payload,
    w.id,
    w.url,
    w.secret
  FROM pending p
  JOIN public.webhook_events e ON e.id = p.id
  JOIN public.merchant_webhooks w
    ON w.merchant_id = e.merchant_id
   AND w.is_active = TRUE
   AND (
     e.event_type = ANY (w.events)
     OR 'order.status_changed' = ANY (w.events)
     OR '*' = ANY (w.events)
   );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_webhook_event_result(
  p_event_id UUID,
  p_ok BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
BEGIN
  SELECT merchant_id INTO v_merchant_id
  FROM public.webhook_events
  WHERE id = p_event_id;

  IF v_merchant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT (
    public.is_admin()
    OR public.user_belongs_to_merchant(v_merchant_id)
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.webhook_events
  SET
    status = CASE WHEN p_ok THEN 'delivered' ELSE 'failed' END,
    attempts = attempts + 1,
    last_error = CASE WHEN p_ok THEN NULL ELSE left(COALESCE(p_error, 'error'), 500) END,
    processed_at = NOW()
  WHERE id = p_event_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.test_merchant_webhook(p_webhook_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.merchant_webhooks%ROWTYPE;
  v_event_id UUID;
BEGIN
  SELECT * INTO v_row FROM public.merchant_webhooks WHERE id = p_webhook_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Webhook no encontrado';
  END IF;

  IF NOT (
    public.is_admin()
    OR (
      public.user_belongs_to_merchant(v_row.merchant_id)
      AND (public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  INSERT INTO public.webhook_events (merchant_id, event_type, payload, status)
  VALUES (
    v_row.merchant_id,
    'webhook.test',
    jsonb_build_object(
      'message', 'Evento de prueba RapideX',
      'webhook_id', v_row.id,
      'at', NOW()
    ),
    'pending'
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Encolar al cambiar estado de pedido
CREATE OR REPLACE FUNCTION public.trg_enqueue_order_status_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v_order_id UUID;
  v_branch_id UUID;
  v_order_number TEXT;
BEGIN
  SELECT o.id, o.branch_id, o.order_number, o.merchant_id
  INTO v_order_id, v_branch_id, v_order_number, v_merchant_id
  FROM public.orders o
  WHERE o.id = NEW.order_id;

  IF v_merchant_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.enqueue_webhook_event(
    v_merchant_id,
    'order.status_changed',
    jsonb_build_object(
      'order_id', v_order_id,
      'order_number', v_order_number,
      'status', NEW.new_status,
      'previous_status', NEW.previous_status,
      'branch_id', v_branch_id,
      'at', NOW()
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_webhook ON public.order_status_history;
CREATE TRIGGER trg_order_status_webhook
  AFTER INSERT ON public.order_status_history
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enqueue_order_status_webhook();

-- ---------------------------------------------------------------------------
-- Soporte
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_subject TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_id UUID;
  v_subject TEXT := left(trim(COALESCE(p_subject, '')), 200);
  v_message TEXT := left(trim(COALESCE(p_message, '')), 4000);
  v_priority TEXT := lower(COALESCE(NULLIF(trim(p_priority), ''), 'normal'));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF length(v_subject) < 3 THEN
    RAISE EXCEPTION 'Asunto demasiado corto';
  END IF;
  IF length(v_message) < 3 THEN
    RAISE EXCEPTION 'Mensaje demasiado corto';
  END IF;
  IF v_priority NOT IN ('low', 'normal', 'high', 'urgent') THEN
    v_priority := 'normal';
  END IF;

  INSERT INTO public.support_tickets (user_id, subject, status, priority)
  VALUES (auth.uid(), v_subject, 'open', v_priority)
  RETURNING id INTO v_ticket_id;

  INSERT INTO public.support_messages (ticket_id, author_id, message)
  VALUES (v_ticket_id, auth.uid(), v_message);

  RETURN v_ticket_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_support_message(
  p_ticket_id UUID,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.support_tickets%ROWTYPE;
  v_message TEXT := left(trim(COALESCE(p_message, '')), 4000);
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket no encontrado';
  END IF;

  IF NOT (
    v_ticket.user_id = auth.uid()
    OR public.is_admin()
    OR public.has_role('support_agent')
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF v_ticket.status = 'closed' THEN
    RAISE EXCEPTION 'El ticket está cerrado';
  END IF;

  IF length(v_message) < 1 THEN
    RAISE EXCEPTION 'Mensaje vacío';
  END IF;

  INSERT INTO public.support_messages (ticket_id, author_id, message)
  VALUES (p_ticket_id, auth.uid(), v_message)
  RETURNING id INTO v_id;

  UPDATE public.support_tickets
  SET
    updated_at = NOW(),
    status = CASE
      WHEN public.is_admin() OR public.has_role('support_agent') THEN
        CASE WHEN status = 'open' THEN 'in_progress'::public.ticket_status ELSE status END
      ELSE status
    END
  WHERE id = p_ticket_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_support_ticket_status(
  p_ticket_id UUID,
  p_status public.ticket_status
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.support_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket no encontrado';
  END IF;

  IF public.is_admin() OR public.has_role('support_agent') THEN
    NULL; -- ok
  ELSIF v_ticket.user_id = auth.uid() AND p_status = 'closed' THEN
    NULL; -- el usuario puede cerrar el suyo
  ELSE
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.support_tickets
  SET status = p_status, updated_at = NOW()
  WHERE id = p_ticket_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_support_tickets(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  subject TEXT,
  status public.ticket_status,
  priority TEXT,
  user_id UUID,
  user_email TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_admin BOOLEAN := public.is_admin() OR public.has_role('support_agent');
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.subject,
    t.status,
    t.priority,
    t.user_id,
    p.email,
    t.created_at,
    t.updated_at
  FROM public.support_tickets t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  WHERE v_admin OR t.user_id = auth.uid()
  ORDER BY t.updated_at DESC
  LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_support_ticket_thread(p_ticket_id UUID)
RETURNS TABLE (
  ticket_id UUID,
  subject TEXT,
  status public.ticket_status,
  priority TEXT,
  message_id UUID,
  author_id UUID,
  author_email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_ticket public.support_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF NOT (
    v_ticket.user_id = auth.uid()
    OR public.is_admin()
    OR public.has_role('support_agent')
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    v_ticket.id,
    v_ticket.subject,
    v_ticket.status,
    v_ticket.priority,
    m.id,
    m.author_id,
    p.email,
    m.message,
    m.created_at
  FROM public.support_messages m
  LEFT JOIN public.profiles p ON p.id = m.author_id
  WHERE m.ticket_id = p_ticket_id
  ORDER BY m.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_merchant_webhook(TEXT, TEXT[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_merchant_webhooks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_merchant_webhook_active(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_merchant_webhook(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_webhook_event(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_merchant_webhook_events(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_webhook_deliveries(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_webhook_event_result(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_merchant_webhook(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_support_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_support_ticket_status(UUID, public.ticket_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_support_tickets(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_support_ticket_thread(UUID) TO authenticated;
