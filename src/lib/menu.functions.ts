import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { imageMap, resolveImage, type Category, type Product } from "@/data/menu";
import { publicClient } from "@/lib/settings.functions";

const fallbackImage = imageMap["burger"] as string;

function toProduct(row: Database["public"]["Tables"]["products"]["Row"]): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image: resolveImage(row.image_url, fallbackImage),
    categoryId: row.category_id,
    available: row.available,
  };
}

function toCategory(row: Database["public"]["Tables"]["categories"]["Row"]): Category {
  return { id: row.id, name: row.name, slug: row.slug, sortOrder: row.sort_order };
}

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toCategory);
});

/** Public menu: only available products. */
export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("available", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toProduct);
});

/** Admin: every product, including hidden ones. */
export const getAllProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({ ...toProduct(row), imagePath: row.image_url }));
  });

const categoryInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(60),
  sort_order: z.number().int().min(0).default(0),
});

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => categoryInput.parse(input))
  .handler(async ({ data, context }) => {
    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const payload = { name: data.name, slug, sort_order: data.sort_order };
    if (data.id) {
      const { error } = await context.supabase.from("categories").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true };
    }
    const { error } = await context.supabase.from("categories").insert(payload);
    if (error) throw error;
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const productInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(""),
  price: z.number().min(0),
  category_id: z.string().min(1),
  image_url: z.string().trim().nullable().optional(),
  available: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => productInput.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      name: data.name,
      description: data.description,
      price: data.price,
      category_id: data.category_id,
      image_url: data.image_url ?? null,
      available: data.available,
      sort_order: data.sort_order,
    };
    if (data.id) {
      const { error } = await context.supabase.from("products").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true };
    }
    const { error } = await context.supabase.from("products").insert(payload);
    if (error) throw error;
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const toggleProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string(), available: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("products")
      .update({ available: data.available })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
