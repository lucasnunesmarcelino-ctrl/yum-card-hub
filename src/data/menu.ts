import burger from "@/assets/burger.jpg";
import fries from "@/assets/fries.jpg";
import drink from "@/assets/drink.jpg";
import dessert from "@/assets/dessert.jpg";
import bannerImg from "@/assets/banner.jpg";
import logoImg from "@/assets/logo.png";

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

export type Settings = {
  id: string;
  name: string;
  logo: string;
  banner: string;
  logoPath: string | null;
  bannerPath: string | null;
  whatsapp: string;
  hours: string;
  isOpen: boolean;
};

export const imageMap: Record<string, string> = {
  burger,
  fries,
  drink,
  dessert,
};

export const defaultBanner = bannerImg;
export const defaultLogo = logoImg;

/** Converts a stored image reference into a usable <img src>. */
export function resolveImage(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (imageMap[value]) return imageMap[value] as string;
  return `/api/public/media/${value}`;
}

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
