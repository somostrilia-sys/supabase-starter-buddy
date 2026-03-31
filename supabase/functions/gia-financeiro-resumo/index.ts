import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function safeQuery(supabase: any, table: string, filters: object): Promise<any[]> {
  try {
    let q = supabase.from(table).select("*");
    for (const [k, v] of Object.entries(filters)) {
      if (Array.isArray(v)) q = q.in(k, v);
      else if (typeof v === "object" && v !== null && "gte" in v) q = q.gte(k, (v as any).gte).lte(k, (v as any).lte);
      else q = q.eq(k, v);
    }
    const { data, error } = await q;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

function mesAnterior(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

function intervalo(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const inicio = `${y}-${String(m).padStart(2, "0")}-01`;
  const ultimoDia = new Date(y, m, 0).getDate();
  const fim = `${y}-${String(m).padStart(2, "0")}-${ultimoDia}`;
  return { inicio, fim };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { company_id, mes, tipo } = await req.json();

    if (!mes) {
      return new Response(
        JSON.stringify({ success: false, error: "mes é obrigatório (formato YYYY-MM)" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { inicio, fim } = intervalo(mes);
    const { inicio: inicioAnt, fim: fimAnt } = intervalo(mesAnterior(mes));

    let total = 0;
    let totalAnt = 0;
    let itens: any[] = [];

    if (tipo === "receitas") {
      // Cotações aprovadas/pagas no mês
      const cotacoes = await safeQuery(supabase, "cotacoes", {
        ...(company_id ? { company_id } : {}),
        status: "aprovado",
        created_at: { gte: inicio, lte: fim + "T23:59:59" },
      });
      itens = cotacoes.map((c: any) => ({
        id: c.id,
        descricao: `Cotação ${c.plano} - ${c.lead_nome || c.cpf_cnpj}`,
        valor: Number(c.valor_plano || 0) + Number(c.valor_adesao || 0),
        data: c.created_at,
      }));
      total = itens.reduce((s, i) => s + i.valor, 0);

      // mês anterior
      const cotacoesAnt = await safeQuery(supabase, "cotacoes", {
        ...(company_id ? { company_id } : {}),
        status: "aprovado",
        created_at: { gte: inicioAnt, lte: fimAnt + "T23:59:59" },
      });
      totalAnt = cotacoesAnt.reduce(
        (s: number, c: any) => s + Number(c.valor_plano || 0) + Number(c.valor_adesao || 0),
        0,
      );
    } else if (tipo === "custos") {
      const eventos = await safeQuery(supabase, "eventos_gia", {
        ...(company_id ? { company_id } : {}),
        tipo: ["sinistro", "assistencia", "custo"],
        created_at: { gte: inicio, lte: fim + "T23:59:59" },
      });
      itens = eventos.map((e: any) => ({
        id: e.id,
        descricao: e.descricao || e.tipo || "Custo",
        valor: Number(e.valor || 0),
        data: e.created_at,
      }));
      total = itens.reduce((s, i) => s + i.valor, 0);

      const eventosAnt = await safeQuery(supabase, "eventos_gia", {
        ...(company_id ? { company_id } : {}),
        tipo: ["sinistro", "assistencia", "custo"],
        created_at: { gte: inicioAnt, lte: fimAnt + "T23:59:59" },
      });
      totalAnt = eventosAnt.reduce((s: number, e: any) => s + Number(e.valor || 0), 0);
    } else if (tipo === "inadimplencia") {
      const assocs = await safeQuery(supabase, "associados", {
        ...(company_id ? { company_id } : {}),
        situacao: ["inadimplente", "suspenso"],
      });
      itens = assocs.map((a: any) => ({
        id: a.id,
        descricao: a.nome,
        valor: Number(a.valor_devido || 0),
        situacao: a.situacao,
        dias_atraso: a.dias_atraso || 0,
        telefone: a.telefone,
      }));
      total = itens.reduce((s, i) => s + i.valor, 0);
      totalAnt = total; // sem comparativo histórico disponível
    } else if (tipo === "producao") {
      // produção = total de cotações geradas (qualquer status)
      const cotacoes = await safeQuery(supabase, "cotacoes", {
        ...(company_id ? { company_id } : {}),
        created_at: { gte: inicio, lte: fim + "T23:59:59" },
      });
      itens = cotacoes.map((c: any) => ({
        id: c.id,
        descricao: `${c.plano} - ${c.lead_nome || c.cpf_cnpj}`,
        valor: Number(c.valor_plano || 0),
        status: c.status,
        data: c.created_at,
      }));
      total = itens.length;

      const cotacoesAnt = await safeQuery(supabase, "cotacoes", {
        ...(company_id ? { company_id } : {}),
        created_at: { gte: inicioAnt, lte: fimAnt + "T23:59:59" },
      });
      totalAnt = cotacoesAnt.length;
    }

    const variacao = totalAnt > 0
      ? Math.round(((total - totalAnt) / totalAnt) * 10000) / 100
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        mes,
        tipo,
        company_id,
        total,
        itens,
        comparativo_mes_anterior: {
          mes: mesAnterior(mes),
          total: totalAnt,
          variacao_pct: variacao,
        },
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
