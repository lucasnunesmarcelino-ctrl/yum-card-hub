import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { imageMap, type Category, type Product } from "@/data/menu";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function toProduct(row: Database["public"]["Tables"]["products"]["Row"]): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image: imageMap[row.image_url ?? "burger"] ?? imageMap["burger"],
    categoryId: row.category_id,
    available: row.available,
  };
}

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c): Category => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    sortOrder: c.sort_order,
  }));
});

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("products").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toProduct);
});

export const getProductsByCategory = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("products").select("*").eq("available", true).order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toProduct);
});

export const getAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories:category_id(name, slug)")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row): Product & { category: { name: string; slug: string } } => ({
    ...toProduct(row),
    category: row.categories as { name: string; slug: string },
  }));
});
