CREATE POLICY "Businesses closed during phase A"
ON public.businesses
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Business members closed during phase A"
ON public.business_members
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Platform admins closed during phase A"
ON public.platform_admins
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);