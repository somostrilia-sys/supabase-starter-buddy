/**
 * fix-cache-fipe — Corrige Ducato de "Pesados" para "Vans e Pesados Pequenos"
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Corrigir Ducato, Sprinter, Daily, Master, Boxer, Transit, HR, Bongo → Vans e Pesados Pequenos
  const VANS_KW = ["ducato", "sprinter", "daily", "master", "boxer", "transit", "jumper", "hr ", "bongo", "topic", "kombi"];

  const { data: negs, error } = await supabase
    .from("negociacoes")
    .select("id, veiculo_modelo, tipo_veiculo")
    .eq("tipo_veiculo", "Pesados")
    .not("veiculo_modelo", "is", null)
    .limit(10000);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let corrigidas = 0;
  const detalhes: string[] = [];

  for (const n of (negs || [])) {
    const m = (n.veiculo_modelo || "").toLowerCase();
    if (VANS_KW.some(kw => m.includes(kw))) {
      await supabase
        .from("negociacoes")
        .update({ tipo_veiculo: "Vans e Pesados Pequenos" } as any)
        .eq("id", n.id);
      corrigidas++;
      if (detalhes.length < 20) detalhes.push(`${n.veiculo_modelo}: Pesados → Vans e Pesados Pequenos`);
    }
  }

  return new Response(JSON.stringify({
    sucesso: true,
    mensagem: `${corrigidas} negociações corrigidas.`,
    exemplos: detalhes,
  }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
