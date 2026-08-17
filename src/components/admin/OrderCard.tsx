import { Bike, Clock, CreditCard, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/data/menu";
import { timeAgo, type Order } from "@/data/orders";
import { cn } from "@/lib/utils";

type Props = {
  order: Order;
  nextLabel?: string;
  onAdvance: (id: string) => void;
  onDragStart: (id: string) => void;
};

export function OrderCard({ order, nextLabel, onAdvance, onDragStart }: Props) {
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", order.id);
        onDragStart(order.id);
      }}
      className="cursor-grab rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing hover:shadow-md"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-black">#{order.number}</p>
          <p className="truncate text-sm text-foreground">{order.customer}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {timeAgo(order.createdAt)}
        </span>
      </header>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={order.type === "entrega" ? "default" : "secondary"} className="gap-1">
          {order.type === "entrega" ? (
            <Bike className="h-3 w-3" />
          ) : (
            <ShoppingBag className="h-3 w-3" />
          )}
          {order.type === "entrega" ? "Entrega" : "Retirada"}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <CreditCard className="h-3 w-3" />
          {order.payment}
          {order.payment === "Dinheiro" && order.changeFor
            ? ` · troco ${formatBRL(order.changeFor)}`
            : ""}
        </Badge>
      </div>

      {order.address && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{order.address}</p>
      )}

      <ul className="mt-2 space-y-1 border-t border-border pt-2">
        {order.items.map((item, i) => (
          <li key={i} className="text-xs">
            <span className="font-semibold">
              {item.quantity}x {item.name}
            </span>
            {item.notes && <span className="block italic text-muted-foreground">Obs: {item.notes}</span>}
          </li>
        ))}
      </ul>

      <div className={cn("mt-3 flex items-center justify-between gap-2")}>
        <span className="text-sm font-black text-primary">{formatBRL(order.total)}</span>
        {nextLabel && (
          <Button size="sm" className="h-8 rounded-full text-xs font-bold" onClick={() => onAdvance(order.id)}>
            {nextLabel}
          </Button>
        )}
      </div>
    </article>
  );
}
