CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id
  FROM public.business_members
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC, id ASC
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_business_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_business_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_active_business_by_slug(_slug text)
RETURNS TABLE (id uuid, slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.slug
  FROM public.businesses AS b
  WHERE b.slug = lower(trim(_slug))
    AND b.status = 'active'
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.resolve_active_business_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_active_business_by_slug(text) TO anon, authenticated;
