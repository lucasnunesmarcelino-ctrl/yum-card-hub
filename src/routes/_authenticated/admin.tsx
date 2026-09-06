import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, LogOut, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL, resolveImage, type Category, type Settings } from "@/data/menu";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteCategory,
  deleteProduct,
  getAllProducts,
  getCategories,
  saveCategory,
  saveProduct,
  toggleProduct,
} from "@/lib/menu.functions";
import { getSettings, updateSettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do restaurante — Cardápio Digital" },
      { name: "description", content: "Gerencie nome, logo, banner, WhatsApp, horário, categorias e produtos do cardápio." },
      { property: "og:title", content: "Painel do restaurante" },
      { property: "og:description", content: "Gerencie o cardápio digital do seu restaurante." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type AdminProduct = Awaited<ReturnType<typeof getAllProducts>>[number];

async function uploadImage(file: File, folder: string) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("branding").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

function ImageField({
  label,
  value,
  fallback,
  folder,
  onChange,
}: {
  label: string;
  value: string | null;
  fallback: string;
  folder: string;
  onChange: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-3">
        <img
          src={resolveImage(value, fallback)}
          alt={label}
          className="h-16 w-24 rounded-lg border border-border object-cover"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              onChange(await uploadImage(file, folder));
              toast.success("Imagem enviada");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Falha no envio");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
        <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {busy ? "Enviando..." : "Enviar imagem"}
        </Button>
      </div>
    </div>
  );
}

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchSettings = useServerFn(getSettings);
  const fetchCategories = useServerFn(getCategories);
  const fetchProducts = useServerFn(getAllProducts);

  const settingsQ = useQuery({ queryKey: ["admin-settings"], queryFn: () => fetchSettings() });
  const categoriesQ = useQuery({ queryKey: ["admin-categories"], queryFn: () => fetchCategories() });
  const productsQ = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchProducts() });

  const invalidate = () => {
    void qc.invalidateQueries();
  };

  const [form, setForm] = useState<Settings | null>(null);
  useEffect(() => {
    if (settingsQ.data && !form) setForm(settingsQ.data);
  }, [settingsQ.data, form]);

  const saveSettingsFn = useServerFn(updateSettings);
  const settingsMutation = useMutation({
    mutationFn: (data: Settings) =>
      saveSettingsFn({
        data: {
          id: data.id,
          name: data.name,
          whatsapp: data.whatsapp.replace(/\D/g, ""),
          hours: data.hours,
          is_open: data.isOpen,
          logo_url: data.logoPath,
          banner_url: data.bannerPath,
        },
      }),
    onSuccess: () => {
      toast.success("Configurações salvas");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ----- categorias -----
  const saveCategoryFn = useServerFn(saveCategory);
  const deleteCategoryFn = useServerFn(deleteCategory);
  const [catDialog, setCatDialog] = useState<{ id?: string; name: string } | null>(null);

  const catMutation = useMutation({
    mutationFn: (data: { id?: string; name: string }) =>
      saveCategoryFn({
        data: {
          ...(data.id ? { id: data.id } : {}),
          name: data.name,
          sort_order: (categoriesQ.data?.length ?? 0) + 1,
        },
      }),
    onSuccess: () => {
      setCatDialog(null);
      toast.success("Categoria salva");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ----- produtos -----
  const saveProductFn = useServerFn(saveProduct);
  const deleteProductFn = useServerFn(deleteProduct);
  const toggleProductFn = useServerFn(toggleProduct);

  type ProductForm = {
    id?: string;
    name: string;
    description: string;
    price: string;
    category_id: string;
    image_url: string | null;
    available: boolean;
  };
  const [prodDialog, setProdDialog] = useState<ProductForm | null>(null);

  const prodMutation = useMutation({
    mutationFn: (data: ProductForm) =>
      saveProductFn({
        data: {
          ...(data.id ? { id: data.id } : {}),
          name: data.name,
          description: data.description,
          price: Number(data.price.replace(",", ".")) || 0,
          category_id: data.category_id,
          image_url: data.image_url,
          available: data.available,
          sort_order: 0,
        },
      }),
    onSuccess: () => {
      setProdDialog(null);
      toast.success("Produto salvo");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const categories = categoriesQ.data ?? [];
  const products = productsQ.data ?? [];

  return (
    <main className="min-h-screen bg-muted/30 pb-16">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-black tracking-tight">Painel do restaurante</h1>
            <p className="text-xs text-muted-foreground">{form?.name ?? "Carregando..."}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Ver cardápio
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <Tabs defaultValue="config">
          <TabsList className="w-full">
            <TabsTrigger value="config" className="flex-1">
              Restaurante
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1">
              Cardápio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="mt-4 space-y-4">
            {form && (
              <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-bold">Aceitando pedidos</p>
                    <p className="text-xs text-muted-foreground">
                      Ao desligar, o cardápio mostra aviso de fechado e bloqueia pedidos.
                    </p>
                  </div>
                  <Switch
                    checked={form.isOpen}
                    onCheckedChange={(v) => setForm({ ...form, isOpen: v })}
                  />
                </div>

                <div>
                  <Label htmlFor="s-name">Nome do restaurante</Label>
                  <Input
                    id="s-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="s-hours">Horário de funcionamento</Label>
                  <Input
                    id="s-hours"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="s-whats">WhatsApp (com DDI e DDD, só números)</Label>
                  <Input
                    id="s-whats"
                    inputMode="numeric"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="5585999999999"
                    className="mt-1.5 h-11"
                  />
                </div>

                <ImageField
                  label="Logo"
                  value={form.logoPath}
                  fallback={form.logo}
                  folder="logo"
                  onChange={(path) => setForm({ ...form, logoPath: path })}
                />
                <ImageField
                  label="Banner"
                  value={form.bannerPath}
                  fallback={form.banner}
                  folder="banner"
                  onChange={(path) => setForm({ ...form, bannerPath: path })}
                />

                <Button
                  className="h-11 w-full rounded-full font-bold"
                  disabled={settingsMutation.isPending}
                  onClick={() => settingsMutation.mutate(form)}
                >
                  Salvar alterações
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="menu" className="mt-4 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-black tracking-tight">Categorias</h2>
                <Button size="sm" variant="outline" onClick={() => setCatDialog({ name: "" })}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nova
                </Button>
              </div>
              <ul className="space-y-2">
                {categories.map((c: Category) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                  >
                    <span className="text-sm font-semibold">{c.name}</span>
                    <span className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Editar categoria"
                        onClick={() => setCatDialog({ id: c.id, name: c.name })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Excluir categoria"
                        onClick={async () => {
                          if (!confirm(`Excluir a categoria "${c.name}"?`)) return;
                          try {
                            await deleteCategoryFn({ data: { id: c.id } });
                            invalidate();
                          } catch {
                            toast.error("Remova antes os produtos desta categoria.");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </span>
                  </li>
                ))}
                {categories.length === 0 && (
                  <li className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma categoria ainda.
                  </li>
                )}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-black tracking-tight">Produtos</h2>
                <Button
                  size="sm"
                  disabled={categories.length === 0}
                  onClick={() =>
                    setProdDialog({
                      name: "",
                      description: "",
                      price: "",
                      category_id: categories[0]?.id ?? "",
                      image_url: null,
                      available: true,
                    })
                  }
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Novo produto
                </Button>
              </div>
              <ul className="space-y-2">
                {products.map((p: AdminProduct) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-2"
                  >
                    <img src={p.image} alt={p.name} className="h-14 w-14 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBRL(p.price)}</p>
                    </div>
                    <Switch
                      checked={p.available}
                      aria-label="Disponível"
                      onCheckedChange={async (v) => {
                        await toggleProductFn({ data: { id: p.id, available: v } });
                        invalidate();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Editar produto"
                      onClick={() =>
                        setProdDialog({
                          id: p.id,
                          name: p.name,
                          description: p.description,
                          price: String(p.price),
                          category_id: p.categoryId,
                          image_url: p.imagePath,
                          available: p.available,
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Excluir produto"
                      onClick={async () => {
                        if (!confirm(`Excluir "${p.name}"?`)) return;
                        try {
                          await deleteProductFn({ data: { id: p.id } });
                          invalidate();
                        } catch {
                          toast.error("Não foi possível excluir este produto.");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
                {products.length === 0 && (
                  <li className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum produto cadastrado.
                  </li>
                )}
              </ul>
            </section>
          </TabsContent>
        </Tabs>
      </div>

      {/* Categoria */}
      <Dialog open={!!catDialog} onOpenChange={(o) => !o && setCatDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{catDialog?.id ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              value={catDialog?.name ?? ""}
              onChange={(e) => setCatDialog({ ...(catDialog ?? { name: "" }), name: e.target.value })}
              className="mt-1.5 h-11"
            />
          </div>
          <DialogFooter>
            <Button
              className="w-full rounded-full font-bold"
              disabled={catMutation.isPending}
              onClick={() => catDialog && catMutation.mutate(catDialog)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Produto */}
      <Dialog open={!!prodDialog} onOpenChange={(o) => !o && setProdDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{prodDialog?.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          {prodDialog && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="p-name">Nome</Label>
                <Input
                  id="p-name"
                  value={prodDialog.name}
                  onChange={(e) => setProdDialog({ ...prodDialog, name: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="p-desc">Descrição</Label>
                <Textarea
                  id="p-desc"
                  rows={3}
                  value={prodDialog.description}
                  onChange={(e) => setProdDialog({ ...prodDialog, description: e.target.value })}
                  className="mt-1.5 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="p-price">Preço (R$)</Label>
                  <Input
                    id="p-price"
                    inputMode="decimal"
                    value={prodDialog.price}
                    onChange={(e) => setProdDialog({ ...prodDialog, price: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="p-cat">Categoria</Label>
                  <select
                    id="p-cat"
                    value={prodDialog.category_id}
                    onChange={(e) => setProdDialog({ ...prodDialog, category_id: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {categories.map((c: Category) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ImageField
                label="Foto do produto"
                value={prodDialog.image_url}
                fallback={resolveImage(prodDialog.image_url, "")}
                folder="produtos"
                onChange={(path) => setProdDialog({ ...prodDialog, image_url: path })}
              />

              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-sm font-semibold">Disponível no cardápio</span>
                <Switch
                  checked={prodDialog.available}
                  onCheckedChange={(v) => setProdDialog({ ...prodDialog, available: v })}
                />
              </div>

              <Button
                className="h-11 w-full rounded-full font-bold"
                disabled={prodMutation.isPending}
                onClick={() => prodMutation.mutate(prodDialog)}
              >
                Salvar produto
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
