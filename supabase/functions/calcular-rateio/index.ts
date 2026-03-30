import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

const MULT_REGIAO_DEFAULT: Record<string, number> = {
  sul: 1.0,
  norte: 1.15,
  nordeste: 1.10,
  "centro-oeste": 1.05,
  sudeste: 1.08
};

const MULT_TIPO_DEFAULT: Record<string, number> = {
  automovel: 1.0,
  moto: 0.85,
  pesado: 1.25
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { plano, valor_base, regiao, tipo_veiculo, company_id } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (!valor_base || !regiao || !tipo_veiculo) {
      return new Response(JSON.stringify({ success: false, error: "Campos obrigatórios: valor_base, regiao, tipo_veiculo" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    // Multiplicador regional
    let mult_regiao = MULT_REGIAO_DEFAULT[regiao] ?? 1.0;
    let mult_tipo = MULT_TIPO_DEFAULT[tipo_veiculo] ?? 1.0;
    let fonte = "default";

    // Buscar multiplicadores customizados se existir
    const { data: configs } = await supabase
      .from("rateio_config")
      .select("regiao, tipo_veiculo, multiplicador")
      .eq("company_id", company_id || null);

    if (configs && configs.length > 0) {
      const cfgRegiao = configs.find((c: any) => c.regiao === regiao && !c.tipo_veiculo);
      const cfgTipo = configs.find((c: any) => c.tipo_veiculo === tipo_veiculo && !c.regiao);
      const cfgCombinado = configs.find((c: any) => c.regiao === regiao && c.tipo_veiculo === tipo_veiculo);

      if (cfgCombinado) { mult_regiao = Number(cfgCombinado.multiplicador); mult_tipo = 1.0; fonte = "customizado_combinado"; }
      else {
        if (cfgRegiao) { mult_regiao = Number(cfgRegiao.multiplicador); fonte = "customizado"; }
        if (cfgTipo) { mult_tipo = Number(cfgTipo.multiplicador); fonte = "customizado"; }
      }
    }

    const valor_final = Number(valor_base) * mult_regiao * mult_tipo;

    return new Response(JSON.stringify({
      success: true,
      plano: plano || null,
      regiao,
      tipo_veiculo,
      valor_base: Number(valor_base),
      multiplicador_regiao: mult_regiao,
      multiplicador_tipo: mult_tipo,
      valor_final: Math.round(valor_final * 100) / 100,
      fonte_multiplicadores: fonte,
      detalhamento: {
        base: Number(valor_base),
        apos_regiao: Math.round(Number(valor_base) * mult_regiao * 100) / 100,
        apos_tipo: Math.round(valor_final * 100) / 100
      }
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});
