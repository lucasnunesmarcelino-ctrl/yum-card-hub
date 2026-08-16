import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatBRL, restaurant, type Product } from "@/data/menu";
import { cn } from "@/lib/utils";

export type CheckoutItem = {
  id: string;
  product: Product;
  quantity: number;
  notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CheckoutItem[];
  total: number;
};

type OrderType = "entrega" | "retirada";
type Payment = "pix" | "cartao" | "dinheiro";

const paymentLabels: Record<Payment, string> = {
  pix: "Pix",
  cartao: "Cartão na Entrega",
  dinheiro: "Dinheiro",
};

const maskPhone = (value: string) => {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo")
    .max(80, "Nome muito longo"),
  phone: z
    .string()
    .trim()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone inválido. Ex: (85) 99999-9999"),
  street: z.string().trim().max(120).optional(),
  number: z.string().trim().max(20).optional(),
  district: z.string().trim().max(80).optional(),
  reference: z.string().trim().max(120).optional(),
  changeFor: z.string().trim().max(20).optional(),
});

export function CheckoutSheet({ open, onOpenChange, items, total }: Props) {
  const [orderType, setOrderType] = useState<OrderType>("entrega");
  const [payment, setPayment] = useState<Payment>("pix");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    street: "",
    number: "",
    district: "",
    reference: "",
    changeFor: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const schema = useMemo(
    () =>
      baseSchema.superRefine((data, ctx) => {
        if (orderType === "entrega") {
          if (!data.street?.trim())
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["street"], message: "Informe a rua" });
          if (!data.number?.trim())
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["number"], message: "Informe o número" });
          if (!data.district?.trim())
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["district"],
              message: "Informe o bairro",
            });
        }
      }),
    [orderType],
  );

  const buildMessage = (data: z.infer<typeof baseSchema>) => {
    const lines: string[] = [];
    lines.push(`📋 *NOVO PEDIDO - ${restaurant.name.toUpperCase()}*`);
    lines.push("----------------------------------");
    lines.push(`*Cliente:* ${data.name}`);
    lines.push(`*Telefone:* ${data.phone}`);
    lines.push(`*Tipo:* ${orderType === "entrega" ? "Entrega" : "Retirada no Balcão"}`);
    if (orderType === "entrega") {
      const address = `${data.street}, ${data.number} - ${data.district}`;
      lines.push(`*Endereço:* ${address}`);
      if (data.reference?.trim()) lines.push(`*Referência:* ${data.reference}`);
    }
    lines.push("");
    lines.push("🛒 *ITENS DO PEDIDO:*");
    for (const item of items) {
      lines.push(
        `• ${item.quantity}x ${item.product.name} - ${formatBRL(item.quantity * item.product.price)}`,
      );
      if (item.notes.trim()) lines.push(`  _Obs: ${item.notes.trim()}_`);
    }
    lines.push("");
    const troco =
      payment === "dinheiro" && data.changeFor?.trim() ? ` (Troco para R$ ${data.changeFor})` : "";
    lines.push(`💳 *Pagamento:* ${paymentLabels[payment]}${troco}`);
    lines.push(`💰 *TOTAL:* ${formatBRL(total)}`);
    return lines.join("\n");
  };

  const handleSubmit = () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Revise os dados do pedido");
      return;
    }
    setErrors({});
    const message = buildMessage(result.data);
    const url = `https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const field = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs font-medium text-destructive">{errors[key]}</p>
    ) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="px-0">
          <SheetTitle>Finalizar pedido</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          <section className="rounded-xl border border-border p-3">
            <h3 className="mb-2 text-sm font-black tracking-tight">Resumo do pedido</h3>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-semibold">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatBRL(item.product.price)} cada
                    </span>
                    {item.notes && (
                      <span className="block text-xs italic text-muted-foreground">
                        Obs: {item.notes}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-bold">
                    {formatBRL(item.quantity * item.product.price)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-base font-black">
              <span>Total Geral</span>
              <span className="text-primary">{formatBRL(total)}</span>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-black tracking-tight">Dados de entrega</h3>
            <div>
              <Label htmlFor="ck-name">Nome do cliente</Label>
              <Input
                id="ck-name"
                value={form.name}
                maxLength={80}
                onChange={(e) => set("name")(e.target.value)}
                placeholder="Seu nome completo"
                className="mt-1.5 h-11"
              />
              {field("name")}
            </div>
            <div>
              <Label htmlFor="ck-phone">Telefone / WhatsApp</Label>
              <Input
                id="ck-phone"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set("phone")(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="mt-1.5 h-11"
              />
              {field("phone")}
            </div>

            <div>
              <Label>Tipo de pedido</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(["entrega", "retirada"] as OrderType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrderType(type)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                      orderType === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {type === "entrega" ? "Entrega" : "Retirada no Balcão"}
                  </button>
                ))}
              </div>
            </div>

            {orderType === "entrega" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="ck-street">Rua</Label>
                  <Input
                    id="ck-street"
                    value={form.street}
                    maxLength={120}
                    onChange={(e) => set("street")(e.target.value)}
                    placeholder="Rua das Flores"
                    className="mt-1.5 h-11"
                  />
                  {field("street")}
                </div>
                <div>
                  <Label htmlFor="ck-number">Número</Label>
                  <Input
                    id="ck-number"
                    value={form.number}
                    maxLength={20}
                    onChange={(e) => set("number")(e.target.value)}
                    placeholder="123"
                    className="mt-1.5 h-11"
                  />
                  {field("number")}
                </div>
                <div>
                  <Label htmlFor="ck-district">Bairro</Label>
                  <Input
                    id="ck-district"
                    value={form.district}
                    maxLength={80}
                    onChange={(e) => set("district")(e.target.value)}
                    placeholder="Centro"
                    className="mt-1.5 h-11"
                  />
                  {field("district")}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="ck-reference">Ponto de referência</Label>
                  <Input
                    id="ck-reference"
                    value={form.reference}
                    maxLength={120}
                    onChange={(e) => set("reference")(e.target.value)}
                    placeholder="Próximo à praça"
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-black tracking-tight">Forma de pagamento</h3>
            <RadioGroup
              value={payment}
              onValueChange={(v) => setPayment(v as Payment)}
              className="grid gap-2"
            >
              {(Object.keys(paymentLabels) as Payment[]).map((key) => (
                <Label
                  key={key}
                  htmlFor={`pay-${key}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                    payment === key ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <RadioGroupItem id={`pay-${key}`} value={key} />
                  {paymentLabels[key]}
                </Label>
              ))}
            </RadioGroup>

            {payment === "dinheiro" && (
              <div>
                <Label htmlFor="ck-change">Precisa de troco para quanto?</Label>
                <Input
                  id="ck-change"
                  inputMode="decimal"
                  value={form.changeFor}
                  maxLength={20}
                  onChange={(e) => set("changeFor")(e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="Ex: 100,00"
                  className="mt-1.5 h-11"
                />
              </div>
            )}
          </section>

          <Button
            onClick={handleSubmit}
            className="h-13 w-full gap-2 rounded-full py-4 text-base font-bold"
          >
            <MessageCircle className="h-5 w-5" />
            Confirmar e Enviar Pedido no WhatsApp
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
