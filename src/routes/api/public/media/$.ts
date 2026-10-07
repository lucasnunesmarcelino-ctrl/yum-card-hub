import { createFileRoute } from "@tanstack/react-router";
import { publicClient } from "@/lib/settings.functions";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..") || !/^[a-zA-Z0-9_./-]+$/.test(path)) {
          return new Response("Not found", { status: 404 });
        }
        // Only publish assets referenced by an active public menu, including legacy paths.
        const client = publicClient();
        const [logos, banners, products] = await Promise.all([
          client.from("settings").select("id").eq("logo_url", path).limit(1),
          client.from("settings").select("id").eq("banner_url", path).limit(1),
          client.from("products").select("id").eq("image_url", path).eq("available", true).limit(1),
        ]);
        if (logos.error || banners.error || products.error ||
          !(logos.data?.length || banners.data?.length || products.data?.length)) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("branding").download(path);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
