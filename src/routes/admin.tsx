import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DollarSign, Receipt } from "lucide-react";

import { OrderCard } from "@/components/admin/OrderCard";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatBRL, restaurant } from "@/data/menu";
import { columns, mockOrders, type Order, type OrderStatus } from "@/data/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel da Cozinha — Brasa & Bun" },
      {
        name: "description",
        content:
          "Painel administrativo do Brasa & Bun: acompanhe pedidos em tempo real no quadro Kanban da cozinha.",
      },
      { property: "og:title", content: "Painel da Cozinha — Brasa & Bun" },
      {
        property: "og:description",
        content: "Gerencie novos pedidos, preparo, entrega e conclusão em um quadro Kanban.",
      },
    ],
  }),
  component: AdminPanel,
});

const order: OrderStatus[] = ["novos", "preparo", "entrega", "concluido"];

function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [open, setOpen] = useState(restaurant.open);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hovered, setHovered] = useState<OrderStatus | null>(null);

  const move = (id: string, status: OrderStatus) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

  const advance = (id: string) =>
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = order[Math.min(order.indexOf(o.status) + 1, order.length - 1)];
        return { ...o, status: next };
      }),
    );

  const revenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-black tracking-tight">{restaurant.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn("h-2 w-2 rounded-full", open ? "bg-primary" : "bg-destructive")}
              />
              Loja {open ? "online" : "offline"} · {restaurant.hours}
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-full border border-border px-3 py-2">
            <Switch checked={open} onCheckedChange={setOpen} aria-label="Alternar loja aberta" />
            <span className="text-sm font-semibold">{open ? "Aberto" : "Fechado"}</span>
          </label>
        </div>

        <div className="mx-auto grid max-w-7xl gap-3 px-4 pb-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <Receipt className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Pedidos do dia</p>
              <p className="text-lg font-black">{orders.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Faturamento bruto</p>
              <p className="text-lg font-black">{formatBRL(revenue)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-6">
        <div className="grid w-max grid-flow-col gap-4 lg:w-full lg:grid-flow-row lg:grid-cols-4">
          {columns.map((column) => {
            const items = orders.filter((o) => o.status === column.id);
            return (
              <section
                key={column.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHovered(column.id);
                }}
                onDragLeave={() => setHovered((h) => (h === column.id ? null : h))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragging;
                  if (id) move(id, column.id);
                  setDragging(null);
                  setHovered(null);
                }}
                className={cn(
                  "w-72 rounded-2xl border border-border bg-background p-3 transition-colors lg:w-auto",
                  hovered === column.id && "border-primary bg-primary/5",
                )}
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-sm font-black tracking-tight">
                    <span className={cn("h-2.5 w-2.5 rounded-full", column.dot)} />
                    {column.name}
                  </h2>
                  <Badge variant={column.id === "novos" ? "default" : "secondary"}>
                    {items.length}
                  </Badge>
                </header>

                <div className="space-y-3">
                  {items.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      nextLabel={column.nextLabel}
                      onAdvance={advance}
                      onDragStart={setDragging}
                    />
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                      Nenhum pedido aqui
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
