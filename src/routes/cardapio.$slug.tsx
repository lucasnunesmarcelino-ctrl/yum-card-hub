import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { MenuPage } from "@/components/menu/MenuPage";
import { getCategories, getProducts } from "@/lib/menu.functions";
import { getSettings } from "@/lib/settings.functions";

const menuQueries = (slug: string) => ({
  categories: queryOptions({ queryKey: ["categories", slug], queryFn: () => getCategories({ data: { slug } }) }),
  products: queryOptions({ queryKey: ["products", slug], queryFn: () => getProducts({ data: { slug } }) }),
  settings: queryOptions({ queryKey: ["settings", slug], queryFn: () => getSettings({ data: { slug } }) }),
});

export const Route = createFileRoute("/cardapio/$slug")({
  head: () => ({
    meta: [
      { title: "Cardápio do restaurante — Peça pelo WhatsApp" },
      { name: "description", content: "Veja o cardápio do restaurante e envie seu pedido pelo WhatsApp." },
      { property: "og:title", content: "Cardápio do restaurante" },
      { property: "og:description", content: "Escolha seus produtos e envie o pedido pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context, params }) => {
    const queries = menuQueries(params.slug);
    await Promise.all([
      context.queryClient.ensureQueryData(queries.categories),
      context.queryClient.ensureQueryData(queries.products),
      context.queryClient.ensureQueryData(queries.settings),
    ]);
  },
  component: SlugMenu,
});

function SlugMenu() {
  const { slug } = Route.useParams();
  const queries = menuQueries(slug);
  const { data: categories } = useSuspenseQuery(queries.categories);
  const { data: products } = useSuspenseQuery(queries.products);
  const { data: settings } = useSuspenseQuery(queries.settings);
  return <MenuPage categories={categories} products={products} settings={settings} />;
}