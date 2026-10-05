CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins AS pa
    WHERE pa.user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.has_business_access(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _business_id IS NOT NULL AND (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.business_members AS bm
      WHERE bm.user_id = auth.uid()
        AND bm.business_id = _business_id
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_business_role(_business_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _business_id IS NOT NULL AND (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.business_members AS bm
      WHERE bm.user_id = auth.uid()
        AND bm.business_id = _business_id
        AND bm.role = ANY (_roles)
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_active_business(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _business_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.businesses AS b
    WHERE b.id = _business_id
      AND b.status = 'active'
  )
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_business_access(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_business_role(uuid, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_active_business(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_business_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_business_role(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_business(uuid) TO anon, authenticated;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Businesses closed during phase A" ON public.businesses;
DROP POLICY IF EXISTS "Business members closed during phase A" ON public.business_members;
DROP POLICY IF EXISTS "Platform admins closed during phase A" ON public.platform_admins;
DROP POLICY IF EXISTS "Admins manage settings" ON public.settings;
DROP POLICY IF EXISTS "Settings are public" ON public.settings;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Categories are public" ON public.categories;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
DROP POLICY IF EXISTS "Public products are readable" ON public.products;
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
DROP POLICY IF EXISTS "Orders are public for admin panel" ON public.orders;
DROP POLICY IF EXISTS "Orders can be created by anyone" ON public.orders;
DROP POLICY IF EXISTS "Admins manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Order items are public for admin panel" ON public.order_items;
DROP POLICY IF EXISTS "Order items can be created by anyone" ON public.order_items;

CREATE POLICY "Members read accessible businesses"
ON public.businesses FOR SELECT TO authenticated
USING (public.has_business_access(id));

CREATE POLICY "Owners update their business"
ON public.businesses FOR UPDATE TO authenticated
USING (public.has_business_role(id, ARRAY['owner','admin']))
WITH CHECK (public.has_business_role(id, ARRAY['owner','admin']));

CREATE POLICY "Platform admins manage businesses"
ON public.businesses FOR ALL TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Members read business memberships"
ON public.business_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_business_access(business_id));

CREATE POLICY "Platform admins manage business memberships"
ON public.business_members FOR ALL TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Users read platform admin status"
ON public.platform_admins FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Platform admins manage platform admins"
ON public.platform_admins FOR ALL TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Public reads active business settings"
ON public.settings FOR SELECT TO anon
USING (public.is_active_business(business_id));

CREATE POLICY "Members manage business settings"
ON public.settings FOR ALL TO authenticated
USING (public.has_business_access(business_id))
WITH CHECK (public.has_business_access(business_id));

CREATE POLICY "Public reads active business categories"
ON public.categories FOR SELECT TO anon
USING (public.is_active_business(business_id));

CREATE POLICY "Members manage business categories"
ON public.categories FOR ALL TO authenticated
USING (public.has_business_access(business_id))
WITH CHECK (public.has_business_access(business_id));

CREATE POLICY "Public reads available active business products"
ON public.products FOR SELECT TO anon
USING (available = true AND public.is_active_business(business_id));

CREATE POLICY "Members manage business products"
ON public.products FOR ALL TO authenticated
USING (public.has_business_access(business_id))
WITH CHECK (public.has_business_access(business_id));

CREATE POLICY "Members manage business orders"
ON public.orders FOR ALL TO authenticated
USING (public.has_business_access(business_id))
WITH CHECK (public.has_business_access(business_id));

CREATE POLICY "Members manage business order items"
ON public.order_items FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders AS o
    WHERE o.id = order_items.order_id
      AND public.has_business_access(o.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders AS o
    WHERE o.id = order_items.order_id
      AND public.has_business_access(o.business_id)
  )
);

REVOKE ALL PRIVILEGES ON public.orders FROM anon;
REVOKE ALL PRIVILEGES ON public.order_items FROM anon;
REVOKE ALL PRIVILEGES ON SEQUENCE public.orders_number_seq FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.orders_number_seq TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins upload branding" ON storage.objects;
DROP POLICY IF EXISTS "Admins read branding" ON storage.objects;
DROP POLICY IF EXISTS "Admins update branding" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete branding" ON storage.objects;

CREATE POLICY "Members upload own business branding"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'branding'
  AND public.has_business_access(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Members read own business branding"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'branding'
  AND public.has_business_access(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Members update own business branding"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'branding'
  AND public.has_business_access(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'branding'
  AND public.has_business_access(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Members delete own business branding"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'branding'
  AND public.has_business_access(((storage.foldername(name))[1])::uuid)
);