import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { mes, ano, company_id } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (!mes || !ano) {
      return new Response(JSON.stringify({ success: false, error: "Campos obrigatórios: mes, ano" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const mesStr = String(mes).padStart(2, "0");
    const inicio = `${ano}-${mesStr}-01`;
    // Último dia do mês
    const ultimoDia = new Date(Number(ano), Number(mes), 0).getDate();
    const fim = `${ano}-${mesStr}-${ultimoDia}`;

    // Base query builder helper
    const aq = (table: string) => {
      let q = supabase.from(table).select("*");
      if (company_id) q = (q as any).eq("company_id", company_id);
      return q;
    };

    // Total de associados ativos no período
    let qAtivos = supabase.from("associados").select("id, mensalidade, situacao, created_at, ultimo_pagamento");
    if (company_id) qAtivos = qAtivos.eq("company_id", company_id);
    qAtivos = qAtivos.eq("situacao", "ativo");
    const { data: associados } = await qAtivos;
    const total_associados = associados?.length || 0;

    // Novos associados no período
    let qNovos = supabase.from("associados").select("id").gte("created_at", inicio).lte("created_at", fim + "T23:59:59");
    if (company_id) qNovos = qNovos.eq("company_id", company_id);
    const { count: novos_count } = await qNovos;
    const novos_associados = novos_count || 0;

    // Receita total = soma de mensalidades dos ativos
    const receita_total = (associados || []).reduce((s: number, a: any) => s + Number(a.mensalidade || 0), 0);

    // Inadimplência: ativos com ultimo_pagamento antes do período
    const inadimplentes = (associados || []).filter((a: any) => {
      if (!a.ultimo_pagamento) return true;
      return a.ultimo_pagamento < inicio;
    });
    const inadimplencia_total = inadimplentes.reduce((s: number, a: any) => s + Number(a.mensalidade || 0), 0);

    // Eventos no período (custo estimado de sinistros)
    let qEventos = supabase.from("eventos").select("id, custo, tipo").gte("created_at", inicio).lte("created_at", fim + "T23:59:59");
    if (company_id) qEventos = (qEventos as any).eq("company_id", company_id);
    const { data: eventos } = await qEventos;
    const custo_sinistros = (eventos || []).reduce((s: number, e: any) => s + Number(e.custo || 0), 0);
    const cancelamentos = (eventos || []).filter((e: any) => e.tipo === "cancelamento").length;

    const resultado_liquido = receita_total - custo_sinistros - inadimplencia_total;

    // Salvar fechamento
    const { data: fechamento, error } = await supabase.from("fechamentos").insert([{
      company_id: company_id || null,
      mes: Number(mes),
      ano: Number(ano),
      total_associados,
      novos_associados,
      cancelamentos,
      receita_total: Math.round(receita_total * 100) / 100,
      inadimplencia_total: Math.round(inadimplencia_total * 100) / 100,
      custo_sinistros: Math.round(custo_sinistros * 100) / 100,
      resultado_liquido: Math.round(resultado_liquido * 100) / 100,
      fechado_em: new Date().toISOString()
    }]).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      fechamento_id: fechamento?.id,
      resumo: {
        periodo: `${mesStr}/${ano}`,
        total_associados,
        novos_associados,
        cancelamentos,
        receita_total: Math.round(receita_total * 100) / 100,
        inadimplencia_total: Math.round(inadimplencia_total * 100) / 100,
        custo_sinistros: Math.round(custo_sinistros * 100) / 100,
        resultado_liquido: Math.round(resultado_liquido * 100) / 100
      }
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});
