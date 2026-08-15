import { Plus } from "lucide-react";

import { formatBRL, type Product } from "@/data/menu";

export function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (product: Product) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="min-w-0 space-y-1">
        <h3 className="truncate text-sm font-bold text-card-foreground">{product.name}</h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <p className="pt-1 text-sm font-bold text-primary">{formatBRL(product.price)}</p>
      </div>
      <div className="relative shrink-0">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={768}
          height={768}
          className="h-24 w-24 rounded-xl object-cover"
        />
        <span className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
          <Plus className="h-5 w-5" />
        </span>
      </div>
    </button>
  );
}
