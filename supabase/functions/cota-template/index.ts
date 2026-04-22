import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    if (req.method === "GET") {
      // Retorna CSV pronto pra download (cliente espera text/csv, não JSON).
      // Query param ?format=json mantém retrocompat para docs.
      const url = new URL(req.url);
      if (url.searchParams.get("format") === "json") {
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
        }), { headers: { ...cors, "Content-Type": "application/json" } });
      }
      const csv = [
        "categoria;valor_inicial;valor_final;regional;fator;ativo",
        "Automóvel;0;20000;Todas;1,00;true",
        "Motocicleta;0;10000;Todas;0,60;true",
        "Pesados;0;50000;Todas;1,80;true",
        "Vans;0;30000;Todas;1,20;true",
        "Pesados Porte Pequeno;0;40000;Todas;1,50;true",
      ].join("\n");
      return new Response(csv, {
        headers: {
          ...cors,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=\"template-cotas.csv\"",
        }
      });
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
