import { useMemo, useRef, useState } from "react";
import { Clock, Search, Trash2 } from "lucide-react";

import { CartBar } from "@/components/menu/CartBar";
import { CheckoutSheet } from "@/components/menu/CheckoutSheet";
import { ProductCard } from "@/components/menu/ProductCard";
import { ProductModal } from "@/components/menu/ProductModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatBRL, type Category, type Product, type Settings } from "@/data/menu";
import { cn } from "@/lib/utils";

type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  notes: string;
};

export function MenuPage({
  categories,
  products,
  settings,
}: {
  categories: Category[];
  products: Product[];
  settings: Settings;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? products.filter((product) => product.name.toLowerCase().includes(normalizedQuery))
      : products;
  }, [query, products]);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, { category: Category; items: Product[] }>();
    for (const category of categories) map.set(category.id, { category, items: [] });
    for (const product of filtered) map.get(product.categoryId)?.items.push(product);
    return Array.from(map.values()).filter((group) => group.items.length > 0);
  }, [filtered, categories]);

  return (
    <main className="min-h-screen bg-background pb-28">
      <header>
        <div className="relative h-36 w-full overflow-hidden sm:h-48">
          <img src={settings.banner} alt={`Fachada do restaurante ${settings.name}`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-4">
            <img src={settings.logo} alt={`Logo ${settings.name}`} className="relative z-10 -mt-10 h-20 w-20 rounded-full border-4 border-background bg-background object-cover shadow-md sm:-mt-14 sm:h-28 sm:w-28" />
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h1 className="text-xl font-black tracking-tight">{settings.name}</h1>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <Clock className="h-3.5 w-3.5 shrink-0" /><span>{settings.hours}</span>
              </p>
              <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", settings.isOpen ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}> 
                <span className={cn("h-1.5 w-1.5 rounded-full", settings.isOpen ? "bg-primary" : "bg-destructive")} />
                {settings.isOpen ? "Aberto Agora" : "Fechado"}
              </span>
            </div>
          </div>
          {!settings.isOpen && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm font-semibold text-destructive">Estamos fechados no momento. Você pode ver o cardápio, mas não é possível enviar pedidos agora.</div>}
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no cardápio..." aria-label="Buscar produto" className="h-11 w-full rounded-lg pl-9" />
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 mt-4 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-4xl overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            {categories.map((category) => (
              <Button key={category.id} type="button" variant={activeCategory === category.id ? "default" : "secondary"} className="rounded-full px-4" onClick={() => { setActiveCategory(category.id); sectionRefs.current[category.id]?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
        {groupedByCategory.map(({ category, items }) => (
          <section key={category.id} id={category.id} ref={(element) => { sectionRefs.current[category.id] = element; }} className="scroll-mt-20">
            <h2 className="mb-3 text-base font-black tracking-tight">{category.name}</h2>
            <div className="grid gap-3">{items.map((product) => <ProductCard key={product.id} product={product} onSelect={setSelected} />)}</div>
          </section>
        ))}
        {filtered.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Nenhum produto encontrado para “{query}”.</p>}
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} onAdd={(product, quantity, notes) => { setCart((previous) => [...previous, { id: crypto.randomUUID(), product, quantity, notes }]); setSelected(null); }} />
      <CartBar count={count} total={total} onClick={() => setCartOpen(true)} />
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="px-0"><SheetTitle>Seu pedido</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            {cart.map((item) => (
              <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.quantity}x {item.product.name}</p>{item.notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.notes}</p>}<p className="mt-1 text-sm font-bold text-primary">{formatBRL(item.quantity * item.product.price)}</p></div>
                <Button variant="ghost" size="icon" aria-label="Remover item" className="shrink-0 text-muted-foreground" onClick={() => setCart((previous) => previous.filter((current) => current.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-base font-black"><span>Total</span><span>{formatBRL(total)}</span></div>
            {!settings.isOpen && <p className="text-center text-xs font-semibold text-destructive">Restaurante fechado — pedidos indisponíveis.</p>}
            <Button className="h-12 w-full rounded-full text-base font-bold" disabled={cart.length === 0 || !settings.isOpen} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Avançar para o Pagamento</Button>
          </div>
        </SheetContent>
      </Sheet>
      <CheckoutSheet open={checkoutOpen} onOpenChange={setCheckoutOpen} items={cart} total={total} settings={settings} onSent={() => setCart([])} />
    </main>
  );
}