-- PedidosGo Fase 2: Storage buckets y políticas

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('public-assets', 'public-assets', TRUE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('merchant-logos', 'merchant-logos', TRUE, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('driver-profile-images', 'driver-profile-images', FALSE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('driver-documents', 'driver-documents', FALSE, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('vehicle-documents', 'vehicle-documents', FALSE, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('delivery-evidence', 'delivery-evidence', FALSE, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('support-attachments', 'support-attachments', FALSE, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Públicos: lectura para todos
CREATE POLICY public_assets_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'public-assets');

CREATE POLICY merchant_logos_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'merchant-logos');

CREATE POLICY public_assets_admin_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'public-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'public-assets' AND public.is_admin());

CREATE POLICY merchant_logos_write ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'merchant-logos'
    AND (public.is_admin() OR public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
  )
  WITH CHECK (
    bucket_id = 'merchant-logos'
    AND (public.is_admin() OR public.has_role('merchant_owner') OR public.has_role('merchant_admin'))
  );

-- Fotos de perfil del repartidor
CREATE POLICY driver_profile_images_access ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'driver-profile-images'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  )
  WITH CHECK (
    bucket_id = 'driver-profile-images'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  );

-- Documentos privados del repartidor
CREATE POLICY driver_documents_access ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  )
  WITH CHECK (
    bucket_id = 'driver-documents'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  );

CREATE POLICY vehicle_documents_access ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'vehicle-documents'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  )
  WITH CHECK (
    bucket_id = 'vehicle-documents'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  );

-- Evidencias de entrega
CREATE POLICY delivery_evidence_access ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'delivery-evidence'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.has_role('merchant_operator')
      OR public.has_role('merchant_admin')
      OR public.has_role('merchant_owner')
    )
  )
  WITH CHECK (
    bucket_id = 'delivery-evidence'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  );

-- Adjuntos de soporte
CREATE POLICY support_attachments_access ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (
      public.is_admin()
      OR public.has_role('support_agent')
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  )
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (
      public.is_admin()
      OR public.has_role('support_agent')
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  );
