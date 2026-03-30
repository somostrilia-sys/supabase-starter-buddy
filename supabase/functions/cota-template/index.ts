import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    if (req.method === "GET") {
      // Retorna estrutura de colunas do template
      return new Response(JSON.stringify({
        success: true,
        colunas: [
          { campo: "plano", tipo: "string", descricao: "Nome do plano (basico/intermediario/premium)" },
          { campo: "faixa_fipe_min", tipo: "number", descricao: "Valor mínimo FIPE para esta faixa" },
          { campo: "faixa_fipe_max", tipo: "number", descricao: "Valor máximo FIPE para esta faixa" },
          { campo: "valor_basico", tipo: "number", descricao: "Valor da mensalidade plano básico" },
          { campo: "valor_intermediario", tipo: "number", descricao: "Valor da mensalidade plano intermediário" },
          { campo: "valor_premium", tipo: "number", descricao: "Valor da mensalidade plano premium" },
          { campo: "taxa_adesao", tipo: "number", descricao: "Taxa de adesão" },
          { campo: "regiao", tipo: "string", descricao: "Região: sul/norte/nordeste/centro-oeste/sudeste" }
        ],
        exemplo: {
          plano: "intermediario",
          faixa_fipe_min: 20000,
          faixa_fipe_max: 50000,
          valor_basico: 149.90,
          valor_intermediario: 199.90,
          valor_premium: 289.90,
          taxa_adesao: 350.00,
          regiao: "sudeste"
        }
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { cotas, company_id } = body;

      if (!Array.isArray(cotas) || cotas.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "Campo 'cotas' deve ser um array não vazio" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" }
        });
      }

      const rows = cotas.map((c: any) => ({
        company_id: company_id || null,
        plano: c.plano,
        faixa_fipe_min: Number(c.faixa_fipe_min || 0),
        faixa_fipe_max: Number(c.faixa_fipe_max || 0),
        valor_basico: Number(c.valor_basico || 0),
        valor_intermediario: Number(c.valor_intermediario || 0),
        valor_premium: Number(c.valor_premium || 0),
        taxa_adesao: Number(c.taxa_adesao || 0),
        regiao: c.regiao || null
      }));

      const { data, error } = await supabase.from("cotacoes_template").insert(rows).select();
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, inseridos: data?.length || 0, data }), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Método não suportado" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});
