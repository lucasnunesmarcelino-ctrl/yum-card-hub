-- ============================================================================
-- Tenant-aware RLS matrix (Phase B)
-- Replaces the "closed during phase A" lockdown and the legacy single-tenant
-- `using (true)` policies with a minimal, non-recursive, business-scoped
-- policy set. All helper functions are SECURITY DEFINER, own a fixed
-- search_path, and have PUBLIC execute revoked.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER, fixed search_path, PUBLIC revoked)
-- ----------------------------------------------------------------------------
-- These are the ONLY places allowed to read business_members / platform_admins
-- "sideways". Because they are owned by the migration role (postgres), which
-- bypasses RLS, their internal SELECTs do not re-trigger the RLS policies on
-- business_members / platform_admins, so none of the policies below ever
-- need to subquery those two tables directly -> no recursion is possible.

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_business_member(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = _business_id
      AND bm.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_business_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.has_business_role(_business_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = _business_id
      AND bm.user_id = auth.uid()
      AND bm.role = ANY (_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.has_business_role(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_business_role(uuid, text[]) TO authenticated;

-- Used by server functions (anon/service-role JWT exchange) to resolve "my"
-- business without ever selecting business_members directly from the client.
CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT bm.business_id
  FROM public.business_members bm
  WHERE bm.user_id = auth.uid()
  ORDER BY bm.created_at ASC, bm.id ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_business_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_business_id() TO authenticated;

-- Used for public menu/storefront slug resolution. Deliberately returns only
-- active businesses, and only id/slug (no owner/billing data leaks).
CREATE OR REPLACE FUNCTION public.resolve_active_business_by_slug(_slug text)
RETURNS TABLE (id uuid, slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT b.id, b.slug
  FROM public.businesses b
  WHERE b.slug = lower(trim(_slug))
    AND b.status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_active_business_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_active_business_by_slug(text) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. businesses
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Businesses closed during phase A" ON public.businesses;

CREATE POLICY "Members and platform admins read their business"
ON public.businesses FOR SELECT TO authenticated
USING (public.is_business_member(id) OR public.is_platform_admin());

CREATE POLICY "Owners update their own business"
ON public.businesses FOR UPDATE TO authenticated
USING (public.has_business_role(id, ARRAY['owner']) OR public.is_platform_admin())
WITH CHECK (public.has_business_role(id, ARRAY['owner']) OR public.is_platform_admin());

CREATE POLICY "Platform admins manage businesses"
ON public.businesses FOR ALL TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());
-- No anon policy: public storefronts resolve businesses exclusively through
-- the resolve_active_business_by_slug() SECURITY DEFINER function.
-- No INSERT policy for regular members: new tenants are provisioned via the
-- service_role (server-side), which bypasses RLS entirely.

-- ----------------------------------------------------------------------------
-- 3. business_members
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Business members closed during phase A" ON public.business_members;

CREATE POLICY "Members read their own business roster"
ON public.business_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_business_member(business_id)
  OR public.is_platform_admin()
);

CREATE POLICY "Owners manage their own business roster"
ON public.business_members FOR INSERT TO authenticated
WITH CHECK (public.has_business_role(business_id, ARRAY['owner']) OR public.is_platform_admin());

CREATE POLICY "Owners update their own business roster"
ON public.business_members FOR UPDATE TO authenticated
USING (public.has_business_role(business_id, ARRAY['owner']) OR public.is_platform_admin())
WITH CHECK (public.has_business_role(business_id, ARRAY['owner']) OR public.is_platform_admin());

CREATE POLICY "Owners remove members from their own business"
ON public.business_members FOR DELETE TO authenticated
USING (public.has_business_role(business_id, ARRAY['owner']) OR public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 4. platform_admins
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Platform admins closed during phase A" ON public.platform_admins;

CREATE POLICY "Platform admins are self-readable"
ON public.platform_admins FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_platform_admin());

-- Deliberately no INSERT/UPDATE/DELETE policy for `authenticated`: granting
-- platform-admin status must only ever happen via service_role (bootstrap /
-- back office), never via a client-reachable path.

-- ----------------------------------------------------------------------------
-- 5. settings
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Settings are public" ON public.settings;
DROP POLICY IF EXISTS "Admins manage settings" ON public.settings;

CREATE POLICY "Settings are public for active businesses"
ON public.settings FOR SELECT TO anon, authenticated
USING (
  business_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = settings.business_id AND b.status = 'active'
  )
);

CREATE POLICY "Business members manage their own settings"
ON public.settings FOR ALL TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

-- ----------------------------------------------------------------------------
-- 6. categories
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Categories are public" ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;

CREATE POLICY "Categories are public for active businesses"
ON public.categories FOR SELECT TO anon, authenticated
USING (
  business_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = categories.business_id AND b.status = 'active'
  )
);

CREATE POLICY "Business members manage their own categories"
ON public.categories FOR ALL TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

-- ----------------------------------------------------------------------------
-- 7. products
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public products are readable" ON public.products;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;

CREATE POLICY "Available products are public for active businesses"
ON public.products FOR SELECT TO anon, authenticated
USING (
  available = true
  AND business_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = products.business_id AND b.status = 'active'
  )
);

CREATE POLICY "Business members manage their own products"
ON public.products FOR ALL TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

-- ----------------------------------------------------------------------------
-- 8. orders
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Orders can be created by anyone" ON public.orders;
DROP POLICY IF EXISTS "Orders are public for admin panel" ON public.orders;
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;

-- Checkout (public) always goes through the createOrder server function,
-- which uses the service_role client and therefore bypasses RLS entirely.
-- Anon is intentionally granted NO policy on orders: it can neither read nor
-- insert directly, closing the previous "Orders are public for admin panel"
-- and "anyone can insert" leaks.
REVOKE INSERT, SELECT ON public.orders FROM anon;

CREATE POLICY "Business members manage their own orders"
ON public.orders FOR ALL TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

-- ----------------------------------------------------------------------------
-- 9. order_items
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Order items can be created by anyone" ON public.order_items;
DROP POLICY IF EXISTS "Order items are public for admin panel" ON public.order_items;
DROP POLICY IF EXISTS "Admins manage order items" ON public.order_items;

REVOKE INSERT, SELECT ON public.order_items FROM anon;

CREATE POLICY "Business members manage their own order items"
ON public.order_items FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.is_business_member(o.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.is_business_member(o.business_id)
  )
);
