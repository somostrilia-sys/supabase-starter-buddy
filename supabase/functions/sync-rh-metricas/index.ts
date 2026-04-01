import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const RH_URL = "https://jcpsncaxursiuskoivpy.supabase.co";
const RH_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjcHNuY2F4dXJzaXVza29pdnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAyMjQ1NywiZXhwIjoyMDg4NTk4NDU3fQ.FDoMqwXml2xFRasOe22WKFOIJ5iqqIR-WyGzwFsFDQ8";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const giaUrl = Deno.env.get("SUPABASE_URL")!;
    const giaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const gia = createClient(giaUrl, giaKey);
    const rh = createClient(RH_URL, RH_SERVICE_KEY);

    // 1. Buscar negociações do GIA
    const { data: negs, error: negErr } = await gia
      .from("negociacoes")
      .select("consultor, consultor_id, cooperativa, valor_plano, stage, created_at")
      .not("consultor", "is", null);

    if (negErr) throw new Error(`Erro ao ler negociacoes: ${negErr.message}`);

    // 2. Agregar por consultor + mês
    const aggMap: Record<string, any> = {};
    const stagesVenda = ["concluido", "contrato_assinado", "venda_concretizada", "ativo", "assinatura"];

    for (const n of negs || []) {
      const dt = new Date(n.created_at);
      const ano = dt.getFullYear();
      const mes = dt.getMonth() + 1;
      const periodo = `${ano}-${String(mes).padStart(2, "0")}`;
      const key = `${n.consultor}__${periodo}`;

      if (!aggMap[key]) {
        aggMap[key] = {
          consultor: n.consultor,
          consultor_id: n.consultor_id || null,
          cooperativa: n.cooperativa || null,
          periodo,
          ano,
          mes,
          qtd_negociacoes: 0,
          qtd_vendas: 0,
          valor_total: 0,
        };
      }

      aggMap[key].qtd_negociacoes++;
      if (stagesVenda.includes(n.stage)) {
        aggMap[key].qtd_vendas++;
        aggMap[key].valor_total += Number(n.valor_plano || 0);
      }
    }

    const rows = Object.values(aggMap).map((r: any) => ({
      ...r,
      valor_total: Number(r.valor_total.toFixed(2)),
      taxa_conversao: r.qtd_negociacoes > 0
        ? Number(((r.qtd_vendas / r.qtd_negociacoes) * 100).toFixed(2))
        : 0,
      sincronizado_em: new Date().toISOString(),
    }));

    // 3. Upsert no RH Conecta
    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "Sem dados para sincronizar", negociacoes: 0 }), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const { error: upsertErr, count } = await rh
      .from("metricas_vendas_sync")
      .upsert(rows, { onConflict: "consultor,periodo", count: "exact" });

    if (upsertErr) throw new Error(`Erro ao fazer upsert no RH: ${upsertErr.message}`);

    return new Response(JSON.stringify({
      success: true,
      negociacoes_processadas: negs?.length || 0,
      consultores_unicos: rows.length,
      registros_sincronizados: count || rows.length,
      periodos: [...new Set(rows.map((r: any) => r.periodo))].sort(),
    }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});
