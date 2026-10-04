import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { publicClient } from "@/lib/settings.functions";
import { getAdminClient, resolvePublicBusiness } from "@/lib/tenant.server";

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
  slug: z.string().trim().min(1).max(120),
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
    const business = await resolvePublicBusiness(data.slug);
    if (!business) throw new Error("Restaurante não encontrado");

    const productIds = [...new Set(data.items.map((item) => item.product_id))];
    if (productIds.length !== data.items.length) throw new Error("Pedido contém produtos duplicados");

    const supabaseAdmin = await getAdminClient();
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, price")
      .eq("business_id", business.id)
      .eq("available", true)
      .in("id", productIds);
    if (productsError) throw productsError;
    if (!products || products.length !== productIds.length) {
      throw new Error("Um ou mais produtos não pertencem a este restaurante");
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    const verifiedItems = data.items.map((item) => {
      const product = productsById.get(item.product_id);
      if (!product) throw new Error("Produto inválido");
      return {
        product_id: product.id,
        name: product.name,
        quantity: item.quantity,
        price: Number(product.price),
        notes: item.notes,
      };
    });
    const verifiedTotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (Math.abs(verifiedTotal - data.total) > 0.009) throw new Error("O total do pedido mudou");

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        business_id: business.id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        type: data.type,
        payment: paymentDbLabel[data.payment],
        change_for: data.change_for ?? null,
        street: data.street ?? null,
        number_addr: data.number_addr ?? null,
        district: data.district ?? null,
        reference: data.reference ?? null,
        total: verifiedTotal,
        status: "novos",
      })
      .select("id, number")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "Erro ao criar pedido");
    }

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      verifiedItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      })),
    );
    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id).eq("business_id", business.id);
      throw new Error(itemsError.message);
    }

    return { number: order.number };
  });
