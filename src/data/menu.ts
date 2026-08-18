import burger from "@/assets/burger.jpg";
import fries from "@/assets/fries.jpg";
import drink from "@/assets/drink.jpg";
import dessert from "@/assets/dessert.jpg";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  available: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export const imageMap: Record<string, string> = {
  burger,
  fries,
  drink,
  dessert,
};

export const restaurant = {
  name: "Brasa & Bun",
  hours: "Ter a Dom · 18h00 às 23h30",
  open: true,
  // Número do WhatsApp do restaurante (formato internacional, só dígitos)
  whatsapp: "5585999999999",
};

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
