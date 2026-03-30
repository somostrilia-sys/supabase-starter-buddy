import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { valor_plano, company_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Busca taxa da empresa na tabela de cotas
    const { data: cota } = await supabase
      .from("tabela_cotas")
      .select("*")
      .eq("company_id", company_id)
      .maybeSingle();

    const taxa = Number(cota?.taxa_admin || 0.15);
    const taxa_admin = Number(valor_plano) * taxa;

    return new Response(
      JSON.stringify({
        success: true,
        taxa_admin,
        taxa_percentual: taxa,
        taxa_percentual_formatted: `${(taxa * 100).toFixed(1)}%`,
        valor_plano: Number(valor_plano),
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
