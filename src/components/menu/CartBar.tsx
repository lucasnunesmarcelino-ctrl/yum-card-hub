import { ShoppingBag } from "lucide-react";

import { formatBRL } from "@/data/menu";

export function CartBar({
  count,
  total,
  onClick,
}: {
  count: number;
  total: number;
  onClick: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
      <button
        type="button"
        onClick={onClick}
        className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ShoppingBag className="h-5 w-5 shrink-0" />
          <span className="truncate text-sm font-semibold">
            {count} {count === 1 ? "item" : "itens"}
          </span>
        </span>
        <span className="shrink-0 text-sm font-bold">{formatBRL(total)}</span>
      </button>
    </div>
  );
}
