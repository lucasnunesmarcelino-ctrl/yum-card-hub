import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";

import { MenuPage } from "@/components/menu/MenuPage";
import { getCategories, getProducts } from "@/lib/menu.functions";
import { getSettings } from "@/lib/settings.functions";

const LEGACY_SLUG = "nome-do-restaurante";
const categoriesQuery = () => queryOptions({ queryKey: ["categories", LEGACY_SLUG], queryFn: () => getCategories({ data: { slug: LEGACY_SLUG } }) });
const productsQuery = () => queryOptions({ queryKey: ["products", LEGACY_SLUG], queryFn: () => getProducts({ data: { slug: LEGACY_SLUG } }) });
const settingsQuery = () => queryOptions({ queryKey: ["settings", LEGACY_SLUG], queryFn: () => getSettings({ data: { slug: LEGACY_SLUG } }) });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cardápio Digital — Peça pelo WhatsApp" },
      {
        name: "description",
        content:
          "Veja o cardápio completo, escolha seus produtos, adicione observações e envie o pedido direto pelo WhatsApp do restaurante.",
      },
      { property: "og:title", content: "Cardápio Digital — Peça pelo WhatsApp" },
      {
        property: "og:description",
        content: "Escolha seus produtos e envie o pedido direto pelo WhatsApp do restaurante.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(categoriesQuery());
    context.queryClient.ensureQueryData(productsQuery());
    context.queryClient.ensureQueryData(settingsQuery());
  },
  component: Menu,
});

function Menu() {
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: settings } = useSuspenseQuery(settingsQuery());

  return <MenuPage categories={categories} products={products} settings={settings} />;
}
