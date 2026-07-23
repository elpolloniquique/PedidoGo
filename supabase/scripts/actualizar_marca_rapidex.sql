-- RapideX: actualizar marca en BD ya sembrada (SQL Editor de Supabase)

UPDATE public.app_settings
SET value = CASE key
  WHEN 'app_name' THEN 'RapideX'
  WHEN 'app_short_name' THEN 'RapideX'
  WHEN 'app_support_email' THEN 'soporte@rapidex.cl'
  WHEN 'app_domain' THEN 'rapidex.cl'
  ELSE value
END,
updated_at = NOW()
WHERE key IN ('app_name', 'app_short_name', 'app_support_email', 'app_domain');

UPDATE public.commission_rules
SET name = 'Comisión estándar RapideX'
WHERE name = 'Comisión estándar PedidosGo';

-- Mensaje de notificación de aprobación (si Fase 13 ya estaba aplicada)
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
      'Ya puedes recibir pedidos en RapideX.',
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

SELECT key, value
FROM public.app_settings
WHERE key IN ('app_name', 'app_short_name', 'app_domain', 'app_support_email')
ORDER BY 1;
