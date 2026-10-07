import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type AdminClient = SupabaseClient<Database>;

export type BusinessContext = {
  id: string;
  slug: string;
};

export async function resolveAuthenticatedBusiness(userId: string, client: AdminClient): Promise<BusinessContext> {
  const supabaseAdmin = client;
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) throw new Error("Usuário sem restaurante vinculado");

  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, slug")
    .eq("id", membership.business_id)
    .eq("status", "active")
    .maybeSingle();

  if (businessError) throw businessError;
  if (!business) throw new Error("Restaurante indisponível");
  return business;
}

export async function resolvePublicBusiness(slug: string): Promise<BusinessContext | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id, slug")
    .eq("slug", normalizedSlug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAdminClient(): Promise<AdminClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}