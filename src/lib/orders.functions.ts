import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { publicClient } from "@/lib/settings.functions";

const orderItemSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  notes: z.string().default(""),
});

const paymentDbLabel = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
} as const;

const createOrderSchema = z.object({
  customer_name: z.string().trim().min(2),
  customer_phone: z.string().trim().min(1),
  type: z.enum(["entrega", "retirada"]),
  payment: z.enum(["pix", "cartao", "dinheiro"]),
  change_for: z.number().nullable().optional(),
  street: z.string().trim().nullable().optional(),
  number_addr: z.string().trim().nullable().optional(),
  district: z.string().trim().nullable().optional(),
  reference: z.string().trim().nullable().optional(),
  total: z.number().min(0),
  items: z.array(orderItemSchema).min(1),
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
        payment: paymentDbLabel[data.payment],
        change_for: data.change_for ?? null,
        street: data.street ?? null,
        number_addr: data.number_addr ?? null,
        district: data.district ?? null,
        reference: data.reference ?? null,
        total: data.total,
        status: "novos",
      })
      .select("id, number")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "Erro ao criar pedido");
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      data.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);

    return { number: order.number };
  });
