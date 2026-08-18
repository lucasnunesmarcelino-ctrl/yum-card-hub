import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

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

const orderItemSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  notes: z.string().default(""),
});

const createOrderSchema = z.object({
  customer_name: z.string().trim().min(2),
  customer_phone: z.string().trim().min(1),
  type: z.enum(["entrega", "retirada"]),
  payment: z.enum(["pix", "cartao", "dinheiro"]),
  change_for: z.string().trim().optional(),
  street: z.string().trim().optional(),
  number_addr: z.string().trim().optional(),
  district: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  total: z.number().min(0),
  items: z.array(orderItemSchema),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => createOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        type: data.type,
        payment: data.payment,
        change_for: data.change_for,
        street: data.street,
        number_addr: data.number_addr,
        district: data.district,
        reference: data.reference,
        total: data.total,
        status: "novos",
      })
      .select("number")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "Erro ao criar pedido");
    }

    const orderItems = data.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      throw new Error(itemsError.message ?? "Erro ao salvar itens do pedido");
    }

    return { number: order.number };
  });

export const getOrders = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: z.string(),
        status: z.enum(["novos", "preparo", "entrega", "concluido"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { error } = await supabase.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
