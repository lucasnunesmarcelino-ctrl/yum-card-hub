CREATE POLICY "Admins upload branding" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding');
CREATE POLICY "Admins update branding" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding') WITH CHECK (bucket_id = 'branding');
CREATE POLICY "Admins delete branding" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'branding');
CREATE POLICY "Admins read branding" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'branding');