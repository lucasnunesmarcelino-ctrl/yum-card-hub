CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA app_private TO authenticated;

CREATE OR REPLACE FUNCTION app_private.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins AS pa
    WHERE pa.user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION app_private.has_business_access(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _business_id IS NOT NULL AND (
    app_private.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.business_members AS bm
      WHERE bm.user_id = auth.uid()
        AND bm.business_id = _business_id
    )
  )
$$;

CREATE OR REPLACE FUNCTION app_private.has_business_role(_business_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _business_id IS NOT NULL AND (
    app_private.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.business_members AS bm
      WHERE bm.user_id = auth.uid()
        AND bm.business_id = _business_id
        AND bm.role = ANY (_roles)
    )
  )
$$;

CREATE OR REPLACE FUNCTION app_private.is_active_business(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _business_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.businesses AS b
    WHERE b.id = _business_id AND b.status = 'active'
  )
$$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_business_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_business_role(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_active_business(uuid) TO anon, authenticated;
GRANT USAGE ON SCHEMA app_private TO anon;

DROP POLICY IF EXISTS "Members read accessible businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners update their business" ON public.businesses;
DROP POLICY IF EXISTS "Platform admins manage businesses" ON public.businesses;
DROP POLICY IF EXISTS "Members read business memberships" ON public.business_members;
DROP POLICY IF EXISTS "Platform admins manage business memberships" ON public.business_members;
DROP POLICY IF EXISTS "Users read platform admin status" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins manage platform admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Public reads active business settings" ON public.settings;
DROP POLICY IF EXISTS "Members manage business settings" ON public.settings;
DROP POLICY IF EXISTS "Public reads active business categories" ON public.categories;
DROP POLICY IF EXISTS "Members manage business categories" ON public.categories;
DROP POLICY IF EXISTS "Public reads available active business products" ON public.products;
DROP POLICY IF EXISTS "Members manage business products" ON public.products;
DROP POLICY IF EXISTS "Members manage business orders" ON public.orders;
DROP POLICY IF EXISTS "Members manage business order items" ON public.order_items;
DROP POLICY IF EXISTS "Members upload own business branding" ON storage.objects;
DROP POLICY IF EXISTS "Members read own business branding" ON storage.objects;
DROP POLICY IF EXISTS "Members update own business branding" ON storage.objects;
DROP POLICY IF EXISTS "Members delete own business branding" ON storage.objects;

CREATE POLICY "Members read accessible businesses" ON public.businesses FOR SELECT TO authenticated USING (app_private.has_business_access(id));
CREATE POLICY "Owners update their business" ON public.businesses FOR UPDATE TO authenticated USING (app_private.has_business_role(id, ARRAY['owner','admin'])) WITH CHECK (app_private.has_business_role(id, ARRAY['owner','admin']));
CREATE POLICY "Platform admins manage businesses" ON public.businesses FOR ALL TO authenticated USING (app_private.is_platform_admin()) WITH CHECK (app_private.is_platform_admin());
CREATE POLICY "Members read business memberships" ON public.business_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR app_private.has_business_access(business_id));
CREATE POLICY "Platform admins manage business memberships" ON public.business_members FOR ALL TO authenticated USING (app_private.is_platform_admin()) WITH CHECK (app_private.is_platform_admin());
CREATE POLICY "Users read platform admin status" ON public.platform_admins FOR SELECT TO authenticated USING (user_id = auth.uid() OR app_private.is_platform_admin());
CREATE POLICY "Platform admins manage platform admins" ON public.platform_admins FOR ALL TO authenticated USING (app_private.is_platform_admin()) WITH CHECK (app_private.is_platform_admin());
CREATE POLICY "Public reads active business settings" ON public.settings FOR SELECT TO anon USING (app_private.is_active_business(business_id));
CREATE POLICY "Members manage business settings" ON public.settings FOR ALL TO authenticated USING (app_private.has_business_access(business_id)) WITH CHECK (app_private.has_business_access(business_id));
CREATE POLICY "Public reads active business categories" ON public.categories FOR SELECT TO anon USING (app_private.is_active_business(business_id));
CREATE POLICY "Members manage business categories" ON public.categories FOR ALL TO authenticated USING (app_private.has_business_access(business_id)) WITH CHECK (app_private.has_business_access(business_id));
CREATE POLICY "Public reads available active business products" ON public.products FOR SELECT TO anon USING (available = true AND app_private.is_active_business(business_id));
CREATE POLICY "Members manage business products" ON public.products FOR ALL TO authenticated USING (app_private.has_business_access(business_id)) WITH CHECK (app_private.has_business_access(business_id));
CREATE POLICY "Members manage business orders" ON public.orders FOR ALL TO authenticated USING (app_private.has_business_access(business_id)) WITH CHECK (app_private.has_business_access(business_id));
CREATE POLICY "Members manage business order items" ON public.order_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.orders AS o WHERE o.id = order_items.order_id AND app_private.has_business_access(o.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.orders AS o WHERE o.id = order_items.order_id AND app_private.has_business_access(o.business_id)));
CREATE POLICY "Members upload own business branding" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding' AND app_private.has_business_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Members read own business branding" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'branding' AND app_private.has_business_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Members update own business branding" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding' AND app_private.has_business_access(((storage.foldername(name))[1])::uuid)) WITH CHECK (bucket_id = 'branding' AND app_private.has_business_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Members delete own business branding" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'branding' AND app_private.has_business_access(((storage.foldername(name))[1])::uuid));

DROP FUNCTION public.has_business_role(uuid, text[]);
DROP FUNCTION public.has_business_access(uuid);
DROP FUNCTION public.is_active_business(uuid);
DROP FUNCTION public.is_platform_admin();