import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Clock, Search, Trash2 } from "lucide-react";

import banner from "@/assets/banner.jpg";
import logo from "@/assets/logo.png";
import { CartBar } from "@/components/menu/CartBar";
import { ProductCard } from "@/components/menu/ProductCard";
import { ProductModal } from "@/components/menu/ProductModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { categories, formatBRL, products, restaurant, type Product } from "@/data/menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brasa & Bun — Cardápio Digital de Hambúrgueres" },
      {
        name: "description",
        content:
          "Peça hambúrgueres artesanais, porções, bebidas e sobremesas pelo cardápio digital do Brasa & Bun. Entrega rápida e pedido direto pelo celular.",
      },
      { property: "og:title", content: "Brasa & Bun — Cardápio Digital" },
      {
        property: "og:description",
        content: "Hambúrgueres artesanais, porções e sobremesas. Faça seu pedido em segundos.",
      },
    ],
  }),
  component: Menu,
});

type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  notes: string;
};

function Menu() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [query]);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  const addToCart = (product: Product, quantity: number, notes: string) => {
    setCart((prev) => [...prev, { id: crypto.randomUUID(), product, quantity, notes }]);
    setSelected(null);
  };

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-background pb-28">
      <header>
        <div className="relative h-44 w-full overflow-hidden sm:h-56">
          <img
            src={banner}
            alt={`Fachada do restaurante ${restaurant.name}`}
            width={1536}
            height={640}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
        </div>

        <div className="mx-auto -mt-10 max-w-lg px-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <img
                src={logo}
                alt={`Logo ${restaurant.name}`}
                loading="lazy"
                width={512}
                height={512}
                className="h-16 w-16 shrink-0 rounded-full border border-border bg-background object-contain p-1"
              />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-tight">{restaurant.name}</h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{restaurant.hours}</span>
                </p>
                <span
                  className={cn(
                    "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    restaurant.open
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      restaurant.open ? "bg-primary" : "bg-destructive",
                    )}
                  />
                  {restaurant.open ? "Aberto Agora" : "Fechado"}
                </span>
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no cardápio..."
                aria-label="Buscar produto"
                className="h-11 rounded-full pl-9"
              />
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 mt-4 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => scrollToCategory(c.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  activeCategory === c.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        {categories.map((category) => {
          const items = filtered.filter((p) => p.category === category.id);
          if (items.length === 0) return null;
          return (
            <section
              key={category.id}
              id={category.id}
              ref={(el) => {
                sectionRefs.current[category.id] = el;
              }}
              className="scroll-mt-20"
            >
              <h2 className="mb-3 text-base font-black tracking-tight">{category.name}</h2>
              <div className="grid gap-3">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} onSelect={setSelected} />
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado para “{query}”.
          </p>
        )}
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} onAdd={addToCart} />

      <CartBar count={count} total={total} onClick={() => setCartOpen(true)} />

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="px-0">
            <SheetTitle>Seu pedido</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 py-2">
            {cart.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {item.quantity}x {item.product.name}
                  </p>
                  {item.notes && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.notes}</p>
                  )}
                  <p className="mt-1 text-sm font-bold text-primary">
                    {formatBRL(item.quantity * item.product.price)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover item"
                  className="shrink-0 text-muted-foreground"
                  onClick={() => setCart((prev) => prev.filter((i) => i.id !== item.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-base font-black">
              <span>Total</span>
              <span>{formatBRL(total)}</span>
            </div>
            <Button className="h-12 w-full rounded-full text-base font-bold">
              Finalizar pedido
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
