import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { defaultBanner, defaultLogo, resolveImage, type Settings } from "@/data/menu";

export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function toSettings(row: Database["public"]["Tables"]["settings"]["Row"]): Settings {
  return {
    id: row.id,
    name: row.name,
    logo: resolveImage(row.logo_url, defaultLogo),
    banner: resolveImage(row.banner_url, defaultBanner),
    logoPath: row.logo_url,
    bannerPath: row.banner_url,
    whatsapp: row.whatsapp,
    hours: row.hours,
    isOpen: row.is_open,
  };
}

export const getSettings = createServerFn({ method: "GET" }).handler(async (): Promise<Settings> => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      id: "",
      name: "Meu Restaurante",
      logo: defaultLogo,
      banner: defaultBanner,
      logoPath: null,
      bannerPath: null,
      whatsapp: "5585999999999",
      hours: "Ter a Dom · 18h00 às 23h30",
      isOpen: true,
    };
  }
  return toSettings(data);
});

const settingsSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  whatsapp: z.string().trim().regex(/^\d{10,15}$/, "WhatsApp deve conter apenas números com DDI"),
  hours: z.string().trim().min(2).max(120),
  is_open: z.boolean(),
  logo_url: z.string().trim().nullable().optional(),
  banner_url: z.string().trim().nullable().optional(),
});

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { data: row, error } = await context.supabase
      .from("settings")
      .update({
        name: rest.name,
        whatsapp: rest.whatsapp,
        hours: rest.hours,
        is_open: rest.is_open,
        logo_url: rest.logo_url ?? null,
        banner_url: rest.banner_url ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toSettings(row);
  });
