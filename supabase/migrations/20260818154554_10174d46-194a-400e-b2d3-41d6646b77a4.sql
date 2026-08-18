create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;

alter table public.categories enable row level security;

create policy "Categories are public" on public.categories
  for select to anon using (true);

create policy "Admins manage categories" on public.categories
  for all to authenticated using (true) with check (true);


create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null,
  image_url text,
  category_id uuid not null references public.categories(id) on delete restrict,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;

create policy "Public products are readable" on public.products
  for select to anon using (available = true);

create policy "Admins manage products" on public.products
  for all to authenticated using (true) with check (true);


create sequence public.orders_number_seq start with 100;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number int not null default nextval('public.orders_number_seq'),
  customer_name text not null,
  customer_phone text not null,
  type text not null check (type in ('entrega', 'retirada')),
  payment text not null check (payment in ('Pix', 'Cartão', 'Dinheiro')),
  change_for numeric(10, 2),
  street text,
  number_addr text,
  district text,
  reference text,
  total numeric(10, 2) not null,
  status text not null default 'novos' check (status in ('novos', 'preparo', 'entrega', 'concluido')),
  created_at timestamptz not null default now()
);

grant select, insert on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

create policy "Orders can be created by anyone" on public.orders
  for insert to anon with check (true);

create policy "Orders are public for admin panel" on public.orders
  for select to anon using (true);

create policy "Admins manage orders" on public.orders
  for all to authenticated using (true) with check (true);


create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  name text not null,
  quantity int not null check (quantity > 0),
  price numeric(10, 2) not null,
  notes text,
  created_at timestamptz not null default now()
);

grant select, insert on public.order_items to anon;
grant select, insert, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;

alter table public.order_items enable row level security;

create policy "Order items can be created by anyone" on public.order_items
  for insert to anon with check (true);

create policy "Order items are public for admin panel" on public.order_items
  for select to anon using (true);

create policy "Admins manage order items" on public.order_items
  for all to authenticated using (true) with check (true);


alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;


insert into public.categories (name, slug, sort_order) values
  ('Lanches', 'lanches', 1),
  ('Porções', 'porcoes', 2),
  ('Bebidas', 'bebidas', 3),
  ('Sobremesas', 'sobremesas', 4);

insert into public.products (name, description, price, image_url, category_id, available, sort_order)
select
  data.name,
  data.description,
  data.price,
  data.image_url,
  c.id,
  true,
  data.sort_order
from (
  values
    ('Smash Burger Clássico', 'Dois smash de blend bovino 90g, queijo cheddar derretido, alface, tomate e molho da casa no pão brioche.', 28.90, 'https://duqqpofgcfhjerscepnl.supabase.co/storage/v1/object/public/assets/burger.jpg', 'lanches', 1),
    ('Cheese Bacon Duplo', 'Blend 180g, cheddar duplo, bacon crocante e maionese defumada artesanal no pão australiano.', 36.50, 'https://duqqpofgcfhjerscepnl.supabase.co/storage/v1/object/public/assets/burger.jpg', 'lanches', 2),
    ('Chicken Crispy', 'Filé de frango empanado crocante, coleslaw fresco e molho honey mustard no pão de batata.', 32.00, 'https://duqqpofgcfhjerscepnl.supabase.co/storage/v1/object/public/assets/burger.jpg', 'lanches', 3),
    ('Batata Frita Rústica', 'Porção generosa de batatas rústicas com alecrim e sal marinho.', 19.90, 'https://duqqpofgcfhjerscepnl.supabase.co/storage/v1/object/public/assets/fries.jpg', 'porcoes', 1),
    ('Batata Cheddar & Bacon', 'Batatas crocantes cobertas com cheddar cremoso e cubos de bacon.', 26.90, 'https://duqqpofgcfhjerscepnl.supabase.co/storage/v1/object/public/assets/fries.jpg', 'porcoes', 2),
    ('Refrigerante Lata', 'Lata 350ml gelada. Escolha entre Cola, Guaraná ou Laranja.', 7.50, 'https://duqqpofgcfhjerscepnl.supabase.co/storage/v1/object/public/assets/drink.jpg', 'bebidas', 1),
    ('Chá Gelado de Limão', 'Chá preto gelado com limão siciliano e hortelã, 500ml.', 12.00, 'https://duqqpofgcfhjerscepnl.supabase.co/storage/v1/object/public/assets/drink.jpg', 'bebidas', 2),
    ('Brownie com Sorvete', 'Brownie de chocolate meio amargo servido morno com sorvete de creme.', 22.00, 'https://duqqpofgcfhjerscepnl.supabase.co/storage/v1/object/public/assets/dessert.jpg', 'sobremesas', 1),
    ('Petit Gâteau', 'Bolinho quente com recheio cremoso de chocolate belga e calda de frutas.', 24.50, 'https://duqqpofgcfhjerscepnl.supabase.co/storage/v1/object/public/assets/dessert.jpg', 'sobremesas', 2)
) as data(name, description, price, image_url, slug, sort_order)
join public.categories c on c.slug = data.slug;
