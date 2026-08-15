import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL, type Product } from "@/data/menu";

type Props = {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product, quantity: number, notes: string) => void;
};

export function ProductModal({ product, onClose, onAdd }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setNotes("");
    }
  }, [product]);

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        {product && (
          <>
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              width={768}
              height={768}
              className="h-56 w-full object-cover"
            />
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
                <p className="text-lg font-bold text-primary">{formatBRL(product.price)}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-semibold">
                  Alguma observação?
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: sem cebola, ponto da carne, etc."
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border border-border p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    aria-label="Diminuir quantidade"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    aria-label="Aumentar quantidade"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  className="h-11 flex-1 rounded-full font-semibold"
                  onClick={() => onAdd(product, quantity, notes)}
                >
                  Adicionar · {formatBRL(product.price * quantity)}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
