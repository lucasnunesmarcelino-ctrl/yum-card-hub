DO $$
BEGIN
  IF (SELECT count(*) FROM public.settings) <> 1 THEN
    RAISE EXCEPTION 'Phase A requires exactly one settings row';
  END IF;

  IF (SELECT count(*) FROM auth.users) <> 1 THEN
    RAISE EXCEPTION 'Phase A requires exactly one auth user';
  END IF;
END
$$;

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_members TO authenticated;
GRANT ALL ON public.business_members TO service_role;

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.settings ADD COLUMN business_id uuid NULL;
ALTER TABLE public.categories ADD COLUMN business_id uuid NULL;
ALTER TABLE public.products ADD COLUMN business_id uuid NULL;
ALTER TABLE public.orders ADD COLUMN business_id uuid NULL;

ALTER TABLE public.settings
  ADD CONSTRAINT settings_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.categories
  ADD CONSTRAINT categories_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.products
  ADD CONSTRAINT products_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.orders
  ADD CONSTRAINT orders_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.settings
  ADD CONSTRAINT settings_business_id_key UNIQUE (business_id);

CREATE INDEX settings_business_id_idx ON public.settings (business_id);
CREATE INDEX categories_business_id_idx ON public.categories (business_id);
CREATE INDEX products_business_id_idx ON public.products (business_id);
CREATE INDEX orders_business_id_idx ON public.orders (business_id);
CREATE INDEX products_business_id_category_id_idx ON public.products (business_id, category_id);
CREATE INDEX orders_business_id_created_at_idx ON public.orders (business_id, created_at);
CREATE INDEX business_members_business_id_idx ON public.business_members (business_id);
CREATE INDEX business_members_user_id_idx ON public.business_members (user_id);

CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
DECLARE
  first_business_id uuid;
  first_user_id uuid;
  current_name text;
  base_slug text;
  final_slug text;
  suffix integer := 1;
BEGIN
  SELECT id, name
  INTO STRICT first_business_id, current_name
  FROM public.settings
  ORDER BY created_at ASC
  LIMIT 1;

  first_business_id := gen_random_uuid();

  base_slug := lower(translate(current_name,
    'áàâãäåéèêëíìîïóòôõöúùûüçñýÿÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝ',
    'aaaaaaeeeeiiiiooooouuuucnyyAAAAAAEEEEIIIIOOOOOUUUUCNY'));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');
  IF base_slug = '' THEN
    base_slug := 'restaurante';
  END IF;

  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.businesses WHERE slug = final_slug) LOOP
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix::text;
  END LOOP;

  INSERT INTO public.businesses (id, name, slug)
  VALUES (first_business_id, current_name, final_slug);

  SELECT id
  INTO STRICT first_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (first_business_id, first_user_id, 'owner');

  INSERT INTO public.platform_admins (user_id)
  VALUES (first_user_id);

  UPDATE public.settings SET business_id = first_business_id;
  UPDATE public.categories SET business_id = first_business_id;
  UPDATE public.products SET business_id = first_business_id;
  UPDATE public.orders SET business_id = first_business_id;
END
$$;