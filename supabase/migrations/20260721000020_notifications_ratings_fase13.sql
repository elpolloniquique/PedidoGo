-- PedidosGo Fase 13: notificaciones in-app + ratings de repartidor

-- ---------------------------------------------------------------------------
-- Ratings: 1 por pedido + índice
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_driver_ratings_order_id
  ON public.driver_ratings (order_id)
  WHERE order_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Helpers de notificación
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_in_app_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type public.notification_type DEFAULT 'info',
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_enabled BOOLEAN;
BEGIN
  IF p_user_id IS NULL OR NULLIF(trim(p_title), '') IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(np.in_app_enabled, TRUE)
  INTO v_enabled
  FROM public.notification_preferences np
  WHERE np.user_id = p_user_id;

  IF v_enabled IS FALSE THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (
    p_user_id,
    trim(p_title),
    COALESCE(NULLIF(trim(p_message), ''), trim(p_title)),
    COALESCE(p_type, 'info'),
    COALESCE(p_data, '{}'::JSONB)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_branch_users(
  p_branch_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type public.notification_type DEFAULT 'info',
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v_uid UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT merchant_id INTO v_merchant_id
  FROM public.branches
  WHERE id = p_branch_id;

  IF v_merchant_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_uid IN
    SELECT DISTINCT mu.user_id
    FROM public.merchant_users mu
    WHERE mu.merchant_id = v_merchant_id
      AND mu.is_active = TRUE
      AND (mu.branch_id IS NULL OR mu.branch_id = p_branch_id)
  LOOP
    IF public.create_in_app_notification(v_uid, p_title, p_message, p_type, p_data) IS NOT NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_driver_user(
  p_driver_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type public.notification_type DEFAULT 'delivery',
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM public.drivers WHERE id = p_driver_id;
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN public.create_in_app_notification(v_user_id, p_title, p_message, p_type, p_data);
END;
$$;

-- ---------------------------------------------------------------------------
-- Triggers de eventos de negocio
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_notify_new_delivery_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_price NUMERIC;
BEGIN
  SELECT dr.branch_id, dr.order_id, o.order_number, NEW.offered_price
  INTO v_branch_id, v_order_id, v_order_number, v_price
  FROM public.delivery_requests dr
  JOIN public.orders o ON o.id = dr.order_id
  WHERE dr.id = NEW.delivery_request_id;

  IF v_branch_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.notify_branch_users(
    v_branch_id,
    'Nueva oferta de entrega',
    format('Pedido %s: oferta de $%s', COALESCE(v_order_number, '—'), to_char(v_price, 'FM999999990')),
    'offer',
    jsonb_build_object(
      'order_id', v_order_id,
      'delivery_request_id', NEW.delivery_request_id,
      'offer_id', NEW.id,
      'offered_price', v_price
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_delivery_offer ON public.delivery_offers;
CREATE TRIGGER trg_notify_new_delivery_offer
  AFTER INSERT ON public.delivery_offers
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.trg_notify_new_delivery_offer();

CREATE OR REPLACE FUNCTION public.trg_notify_delivery_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
BEGIN
  SELECT dr.branch_id, dr.order_id, o.order_number
  INTO v_branch_id, v_order_id, v_order_number
  FROM public.delivery_requests dr
  JOIN public.orders o ON o.id = dr.order_id
  WHERE dr.id = NEW.delivery_request_id;

  PERFORM public.notify_driver_user(
    NEW.driver_id,
    'Pedido asignado',
    format('Te asignaron el pedido %s. Revisa la entrega activa.', COALESCE(v_order_number, '')),
    'delivery',
    jsonb_build_object(
      'order_id', v_order_id,
      'delivery_request_id', NEW.delivery_request_id,
      'assignment_id', NEW.id
    )
  );

  IF v_branch_id IS NOT NULL THEN
    PERFORM public.notify_branch_users(
      v_branch_id,
      'Repartidor asignado',
      format('El pedido %s ya tiene repartidor.', COALESCE(v_order_number, '')),
      'delivery',
      jsonb_build_object(
        'order_id', v_order_id,
        'delivery_request_id', NEW.delivery_request_id,
        'driver_id', NEW.driver_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_delivery_assignment ON public.delivery_assignments;
CREATE TRIGGER trg_notify_delivery_assignment
  AFTER INSERT ON public.delivery_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_delivery_assignment();

CREATE OR REPLACE FUNCTION public.trg_notify_delivery_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_driver_id UUID;
  v_label TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT o.id, o.order_number INTO v_order_id, v_order_number
  FROM public.orders o
  WHERE o.id = NEW.order_id;

  SELECT da.driver_id INTO v_driver_id
  FROM public.delivery_assignments da
  WHERE da.delivery_request_id = NEW.id;

  v_label := CASE NEW.status::TEXT
    WHEN 'searching_driver' THEN 'Buscando repartidor'
    WHEN 'receiving_offers' THEN 'Recibiendo ofertas'
    WHEN 'driver_selected' THEN 'Repartidor asignado'
    WHEN 'driver_heading_to_store' THEN 'Repartidor hacia el local'
    WHEN 'driver_arrived_store' THEN 'Repartidor en el local'
    WHEN 'order_picked_up' THEN 'Pedido recogido'
    WHEN 'heading_to_customer' THEN 'En camino al cliente'
    WHEN 'driver_arrived_customer' THEN 'Repartidor con el cliente'
    WHEN 'delivered' THEN 'Entregado'
    WHEN 'cancelled' THEN 'Cancelado'
    ELSE NEW.status::TEXT
  END;

  -- Evitar duplicar el aviso de asignación (ya cubierto por assignment trigger)
  IF NEW.status <> 'driver_selected' THEN
    PERFORM public.notify_branch_users(
      NEW.branch_id,
      'Actualización de entrega',
      format('Pedido %s: %s', COALESCE(v_order_number, '—'), v_label),
      'delivery',
      jsonb_build_object(
        'order_id', v_order_id,
        'delivery_request_id', NEW.id,
        'status', NEW.status::TEXT
      )
    );
  END IF;

  IF v_driver_id IS NOT NULL AND NEW.status IN (
    'driver_heading_to_store',
    'driver_arrived_store',
    'order_picked_up',
    'heading_to_customer',
    'driver_arrived_customer',
    'delivered',
    'cancelled'
  ) THEN
    -- Si el cambio lo hizo el propio driver, igual conviene dejar historial corto
    PERFORM public.notify_driver_user(
      v_driver_id,
      'Estado de entrega',
      format('Pedido %s: %s', COALESCE(v_order_number, '—'), v_label),
      CASE WHEN NEW.status = 'delivered' THEN 'payment'::public.notification_type ELSE 'delivery'::public.notification_type END,
      jsonb_build_object(
        'order_id', v_order_id,
        'delivery_request_id', NEW.id,
        'status', NEW.status::TEXT
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_delivery_status ON public.delivery_requests;
CREATE TRIGGER trg_notify_delivery_status
  AFTER UPDATE OF status ON public.delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_delivery_status();

CREATE OR REPLACE FUNCTION public.trg_notify_payment_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    PERFORM public.notify_driver_user(
      NEW.driver_id,
      'Pago de comisión aprobado',
      format('Se aprobó tu pago de $%s.', to_char(NEW.amount, 'FM999999990.00')),
      'payment',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status)
    );
  ELSIF NEW.status = 'rejected' THEN
    PERFORM public.notify_driver_user(
      NEW.driver_id,
      'Pago de comisión rechazado',
      format('Tu pago de $%s fue rechazado.', to_char(NEW.amount, 'FM999999990.00')),
      'payment',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_payment_review ON public.payments;
CREATE TRIGGER trg_notify_payment_review
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_payment_review();

CREATE OR REPLACE FUNCTION public.trg_notify_driver_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    PERFORM public.notify_driver_user(
      NEW.id,
      'Solicitud aprobada',
      'Ya puedes recibir pedidos en PedidosGo.',
      'system',
      jsonb_build_object('driver_id', NEW.id, 'status', NEW.status::TEXT)
    );
  ELSIF NEW.status IN ('rejected', 'suspended') THEN
    PERFORM public.notify_driver_user(
      NEW.id,
      'Actualización de cuenta',
      format('Tu estado de repartidor es: %s.', NEW.status::TEXT),
      'system',
      jsonb_build_object('driver_id', NEW.id, 'status', NEW.status::TEXT)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_driver_status ON public.drivers;
CREATE TRIGGER trg_notify_driver_status
  AFTER UPDATE OF status ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_driver_status();

-- ---------------------------------------------------------------------------
-- RPCs cliente: leer / marcar notificaciones
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_my_notification_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = COALESCE(read_at, NOW())
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_my_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = COALESCE(read_at, NOW())
  WHERE user_id = auth.uid()
    AND is_read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications n
    WHERE n.user_id = auth.uid()
      AND n.is_read = FALSE
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Ratings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_driver_rating(
  p_order_id UUID,
  p_score SMALLINT,
  p_comment TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
  v_order_status public.order_status;
  v_driver_id UUID;
  v_rating_id UUID;
  v_avg NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF p_score IS NULL OR p_score < 1 OR p_score > 5 THEN
    RAISE EXCEPTION 'La calificación debe ser entre 1 y 5';
  END IF;

  SELECT o.branch_id, o.status
  INTO v_branch_id, v_order_status
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF NOT (public.is_admin() OR public.user_belongs_to_branch(v_branch_id)) THEN
    RAISE EXCEPTION 'Sin permiso para calificar este pedido';
  END IF;

  IF v_order_status <> 'delivered' THEN
    RAISE EXCEPTION 'Solo se puede calificar un pedido entregado';
  END IF;

  SELECT da.driver_id INTO v_driver_id
  FROM public.delivery_requests dr
  JOIN public.delivery_assignments da ON da.delivery_request_id = dr.id
  WHERE dr.order_id = p_order_id;

  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'El pedido no tiene repartidor asignado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.driver_ratings r WHERE r.order_id = p_order_id) THEN
    RAISE EXCEPTION 'Este pedido ya fue calificado';
  END IF;

  INSERT INTO public.driver_ratings (driver_id, order_id, rated_by, score, comment)
  VALUES (
    v_driver_id,
    p_order_id,
    auth.uid(),
    p_score,
    NULLIF(trim(COALESCE(p_comment, '')), '')
  )
  RETURNING id INTO v_rating_id;

  SELECT ROUND(AVG(score)::NUMERIC, 2) INTO v_avg
  FROM public.driver_ratings
  WHERE driver_id = v_driver_id;

  UPDATE public.drivers
  SET average_rating = COALESCE(v_avg, 0), updated_at = NOW()
  WHERE id = v_driver_id;

  PERFORM public.notify_driver_user(
    v_driver_id,
    'Nueva calificación',
    format('Te calificaron con %s estrellas.', p_score),
    'info',
    jsonb_build_object('order_id', p_order_id, 'score', p_score, 'rating_id', v_rating_id)
  );

  RETURN v_rating_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_rating(p_order_id UUID)
RETURNS TABLE (
  rating_id UUID,
  score SMALLINT,
  comment TEXT,
  created_at TIMESTAMPTZ,
  average_rating NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
  v_driver_id UUID;
BEGIN
  SELECT o.branch_id INTO v_branch_id
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_branch_id IS NULL THEN
    RETURN;
  END IF;

  SELECT da.driver_id INTO v_driver_id
  FROM public.delivery_requests dr
  JOIN public.delivery_assignments da ON da.delivery_request_id = dr.id
  WHERE dr.order_id = p_order_id;

  IF NOT (
    public.is_admin()
    OR public.user_belongs_to_branch(v_branch_id)
    OR v_driver_id = public.get_my_driver_id()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.score,
    r.comment,
    r.created_at,
    d.average_rating
  FROM public.driver_ratings r
  JOIN public.drivers d ON d.id = r.driver_id
  WHERE r.order_id = p_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Realtime: notifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_in_app_notification(UUID, TEXT, TEXT, public.notification_type, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_branch_users(UUID, TEXT, TEXT, public.notification_type, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_driver_user(UUID, TEXT, TEXT, public.notification_type, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_my_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_my_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_driver_rating(UUID, SMALLINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_rating(UUID) TO authenticated;

-- create_in_app_notification no debería ser usado por clientes arbitrarios para spamear;
-- revocamos execute público amplio y dejamos solo service/triggers (owner = postgres/supabase_admin).
-- En Supabase el owner es el rol que corre migraciones; triggers usan SECURITY DEFINER.
REVOKE EXECUTE ON FUNCTION public.create_in_app_notification(UUID, TEXT, TEXT, public.notification_type, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_branch_users(UUID, TEXT, TEXT, public.notification_type, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_driver_user(UUID, TEXT, TEXT, public.notification_type, JSONB) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.submit_driver_rating(UUID, SMALLINT, TEXT) IS
  'Fase 13: comercio/admin califica al repartidor tras delivered.';
