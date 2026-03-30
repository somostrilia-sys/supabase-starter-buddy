import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { tipo, company_id, data_inicio, data_fim, filtros } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (!tipo) {
      return new Response(JSON.stringify({ success: false, error: "Campo 'tipo' obrigatório" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const TIPOS = ["associados", "financeiro", "eventos", "veiculos", "inadimplencia"];
    if (!TIPOS.includes(tipo)) {
      return new Response(JSON.stringify({ success: false, error: `Tipo inválido. Use: ${TIPOS.join(", ")}` }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    let data: any[] = [];
    let totais: Record<string, any> = {};

    if (tipo === "associados") {
      let q = supabase.from("associados").select("id, nome, cpf_cnpj, telefone, email, situacao, plano, mensalidade, created_at, dados_sga");
      if (company_id) q = q.eq("company_id", company_id);
      if (data_inicio) q = q.gte("created_at", data_inicio);
      if (data_fim) q = q.lte("created_at", data_fim);
      const { data: rows, error } = await q.order("nome");
      if (error) throw error;
      data = rows || [];
      totais = {
        total: data.length,
        ativos: data.filter((a: any) => a.situacao === "ativo").length,
        inativos: data.filter((a: any) => a.situacao !== "ativo").length,
        mensalidade_total: data.reduce((s: number, a: any) => s + Number(a.mensalidade || 0), 0)
      };
    }

    else if (tipo === "financeiro") {
      let q = supabase.from("fechamentos").select("*");
      if (company_id) q = q.eq("company_id", company_id);
      if (data_inicio) q = q.gte("created_at", data_inicio);
      if (data_fim) q = q.lte("created_at", data_fim);
      const { data: rows, error } = await q.order("ano", { ascending: false }).order("mes", { ascending: false });
      if (error) throw error;
      data = rows || [];
      totais = {
        receita_total: data.reduce((s: number, f: any) => s + Number(f.receita_total || 0), 0),
        inadimplencia_total: data.reduce((s: number, f: any) => s + Number(f.inadimplencia_total || 0), 0),
        custo_sinistros_total: data.reduce((s: number, f: any) => s + Number(f.custo_sinistros || 0), 0),
        resultado_liquido_total: data.reduce((s: number, f: any) => s + Number(f.resultado_liquido || 0), 0)
      };
    }

    else if (tipo === "eventos") {
      let q = supabase.from("eventos").select("id, tipo, descricao, status, created_at, resolved_at");
      if (company_id) q = q.eq("company_id", company_id);
      if (data_inicio) q = q.gte("created_at", data_inicio);
      if (data_fim) q = q.lte("created_at", data_fim);
      const { data: rows } = await q.order("created_at", { ascending: false });
      data = rows || [];
      totais = {
        total: data.length,
        resolvidos: data.filter((e: any) => e.status === "resolvido").length,
        pendentes: data.filter((e: any) => e.status !== "resolvido").length
      };
    }

    else if (tipo === "veiculos") {
      let q = supabase.from("veiculos").select("id, placa, modelo, ano, fipe_valor, associado_id, created_at");
      if (company_id) q = q.eq("company_id", company_id);
      if (data_inicio) q = q.gte("created_at", data_inicio);
      if (data_fim) q = q.lte("created_at", data_fim);
      const { data: rows } = await q.order("modelo");
      data = rows || [];
      totais = { total: data.length };
    }

    else if (tipo === "inadimplencia") {
      const hoje = new Date();
      const d30 = new Date(hoje); d30.setDate(d30.getDate() - 30);
      const d60 = new Date(hoje); d60.setDate(d60.getDate() - 60);
      const d90 = new Date(hoje); d90.setDate(d90.getDate() - 90);

      let q = supabase.from("associados").select("id, nome, cpf_cnpj, telefone, email, mensalidade, ultimo_pagamento, situacao");
      if (company_id) q = q.eq("company_id", company_id);
      q = q.eq("situacao", "ativo").not("ultimo_pagamento", "is", null).lt("ultimo_pagamento", d30.toISOString().split("T")[0]);
      const { data: rows } = await q;
      data = (rows || []).map((a: any) => {
        const ult = new Date(a.ultimo_pagamento);
        const dias = Math.floor((hoje.getTime() - ult.getTime()) / 86400000);
        return { ...a, dias_atraso: dias, faixa: dias >= 90 ? "+90" : dias >= 60 ? "+60" : "+30" };
      });
      totais = {
        total_inadimplentes: data.length,
        faixa_30: data.filter((a: any) => a.faixa === "+30").length,
        faixa_60: data.filter((a: any) => a.faixa === "+60").length,
        faixa_90: data.filter((a: any) => a.faixa === "+90").length,
        valor_em_aberto: data.reduce((s: number, a: any) => s + Number(a.mensalidade || 0), 0)
      };
    }

    return new Response(JSON.stringify({
      success: true,
      tipo,
      periodo: { data_inicio: data_inicio || null, data_fim: data_fim || null },
      data,
      totais,
      gerado_em: new Date().toISOString()
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});
