-- PedidosGo Fase 10 — forzar alta de tablas en Realtime
-- Ejecuta esto si verificar_fase10_solo_publication.sql devuelve 0 filas o menos de 5

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_offers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_current_locations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Debe devolver 5 filas:
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'orders',
    'delivery_requests',
    'delivery_offers',
    'delivery_assignments',
    'driver_current_locations'
  )
ORDER BY 1;
