import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { defaultBanner, defaultLogo, resolveImage, type Settings } from "@/data/menu";
import { resolveAuthenticatedBusiness, resolvePublicBusiness } from "@/lib/tenant.server";

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

function toSettings(
  row: Database["public"]["Tables"]["settings"]["Row"],
  business: { id: string; slug: string },
): Settings {
  return {
    id: row.id,
    businessId: business.id,
    slug: business.slug,
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

const publicSettingsInput = z.object({ slug: z.string().trim().min(1).max(120) });

export const getSettings = createServerFn({ method: "GET" })
  .inputValidator((input) => publicSettingsInput.parse(input))
  .handler(async ({ data }): Promise<Settings> => {
  const business = await resolvePublicBusiness(data.slug);
  if (!business) throw new Error("Restaurante não encontrado");
  const supabase = publicClient();
  const { data: settings, error } = await supabase
    .from("settings")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();
  if (error) throw error;
  if (!settings) throw new Error("Configurações do restaurante não encontradas");
  return toSettings(settings, business);
});

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Settings> => {
    const business = await resolveAuthenticatedBusiness(context.userId, context.supabase);
    const supabaseAdmin = context.supabase;
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Configurações do restaurante não encontradas");
    return toSettings(data, business);
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
    const business = await resolveAuthenticatedBusiness(context.userId, context.supabase);
    const supabaseAdmin = context.supabase;
    const { id, ...rest } = data;
    const { data: row, error } = await supabaseAdmin
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
      .eq("business_id", business.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Configurações não encontradas para este restaurante");
    return toSettings(row, business);
  });
