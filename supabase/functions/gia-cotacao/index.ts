import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Percentual mensal sobre valor FIPE
const FIPE_PCT: Record<string, number> = {
  basico: 0.015,
  intermediario: 0.020,
  premium: 0.025,
  frota: 0.012,
};

const VALOR_ADESAO = 99.90;

function coberturaPorPlano(plano: string) {
  return {
    colisao: plano !== "basico",
    furto_roubo: true,
    incendio: true,
    assistencia_24h: true,
    carro_reserva: plano === "premium" || plano === "frota",
    vidros: plano !== "basico",
    guincho_ilimitado: plano === "premium" || plano === "frota",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const {
      lead_nome,
      cpf_cnpj,
      placa,
      modelo,
      fipe_valor,
      plano = "intermediario",
      company_id,
      consultor_id,
    } = body;

    if (!fipe_valor || !plano) {
      return new Response(
        JSON.stringify({ success: false, error: "fipe_valor e plano são obrigatórios" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const planoKey = plano.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const pct = FIPE_PCT[planoKey] ?? FIPE_PCT["intermediario"];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verificar se existe override de plano na tabela gia_planos
    let valor_plano = Math.round(Number(fipe_valor) * pct * 100) / 100;
    let taxa_admin = Math.round(valor_plano * 0.10 * 100) / 100;

    const { data: giaPlano } = await supabase
      .from("gia_planos")
      .select("*")
      .eq("nome", plano)
      .maybeSingle();

    if (giaPlano) {
      if (giaPlano.percentual_fipe) {
        valor_plano = Math.round(Number(fipe_valor) * Number(giaPlano.percentual_fipe) * 100) / 100;
      } else if (giaPlano.valor_fixo) {
        valor_plano = Number(giaPlano.valor_fixo);
      }
      if (giaPlano.taxa_admin) {
        taxa_admin = Number(giaPlano.taxa_admin);
      }
    }

    const cobertura = coberturaPorPlano(planoKey);
    const valor_adesao = VALOR_ADESAO;
    const validade = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: cotacao, error: insErr } = await supabase
      .from("cotacoes")
      .insert([{
        lead_nome,
        cpf_cnpj,
        placa,
        modelo,
        plano,
        fipe_valor: Number(fipe_valor),
        valor_plano,
        valor_adesao,
        taxa_admin,
        cobertura,
        company_id,
        consultor_id,
        status: "pendente",
        validade_horas: 48,
        validade_ate: validade,
      }])
      .select()
      .single();

    if (insErr) throw new Error(insErr.message);

    return new Response(
      JSON.stringify({
        success: true,
        cotacao_id: cotacao?.id,
        valor_plano,
        valor_adesao,
        taxa_admin,
        cobertura,
        validade,
        validade_horas: 48,
        plano,
        fipe_valor: Number(fipe_valor),
        percentual_aplicado: pct,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
