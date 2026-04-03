// GIA → Walk Finance — Enviar dados financeiros consolidados
// Auth: x-api-key ou chamada interna (cron)

import { validateApiKey, getSupabase, corsHeaders, jsonResponse, errorResponse, logSync } from "../_shared/auth.ts";

const WALK_FINANCE_URL = "https://xytnibnqztjaixemlepb.supabase.co";
const WALK_FINANCE_KEY = Deno.env.get("WALK_FINANCE_SERVICE_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: aceita api key ou authorization header com service role
    const apiKey = req.headers.get("x-api-key");
    if (apiKey) {
      const auth = await validateApiKey(req, "write:finance_data");
      if (!auth.valid) return errorResponse(auth.error!, 401);
    }

    const supabase = getSupabase();
    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = today.substring(0, 8) + "01";

    // 1. Total associados ativos
    const { count: totalAtivos } = await supabase
      .from("associados")
      .select("id", { count: "exact", head: true })
      .eq("status", "ativo");

    // 2. Total inadimplentes
    const { count: totalInadimplentes } = await supabase
      .from("associados")
      .select("id", { count: "exact", head: true })
      .eq("status", "inadimplente");

    // 3. Boletos do mês
    const { data: boletosMes } = await supabase
      .from("boletos")
      .select("valor, status")
      .gte("vencimento", firstOfMonth)
      .lte("vencimento", today);

    const totalFaturado = (boletosMes || []).reduce((s, b) => s + (Number(b.valor) || 0), 0);
    const totalRecebido = (boletosMes || []).filter((b) => b.status === "baixado").reduce((s, b) => s + (Number(b.valor) || 0), 0);
    const totalVencido = (boletosMes || []).filter((b) => b.status === "aberto").reduce((s, b) => s + (Number(b.valor) || 0), 0);

    // 4. Veículos totais
    const { count: totalVeiculos } = await supabase
      .from("veiculos")
      .select("id", { count: "exact", head: true });

    // 5. Eventos do mês (sinistros = custo)
    const { data: eventosMes } = await supabase
      .from("eventos")
      .select("valor_total, tipo")
      .gte("created_at", firstOfMonth);

    const custoEventos = (eventosMes || []).reduce((s, e) => s + (Number(e.valor_total) || 0), 0);

    // 6. Novos associados no mês
    const { count: novosAssociados } = await supabase
      .from("associados")
      .select("id", { count: "exact", head: true })
      .gte("created_at", firstOfMonth);

    const payload = {
      empresa: "objetivo",
      empresa_id: "b1000000-0000-0000-0000-000000000001",
      periodo: today,
      dados: {
        associados_ativos: totalAtivos || 0,
        associados_inadimplentes: totalInadimplentes || 0,
        veiculos_total: totalVeiculos || 0,
        novos_associados_mes: novosAssociados || 0,
        receita_faturada_mes: totalFaturado,
        receita_recebida_mes: totalRecebido,
        receita_vencida_mes: totalVencido,
        taxa_inadimplencia: totalAtivos ? ((totalInadimplentes || 0) / totalAtivos * 100).toFixed(2) : 0,
        custo_eventos_mes: custoEventos,
        eventos_abertos_mes: (eventosMes || []).length,
        margem_operacional: totalRecebido - custoEventos,
      },
    };

    // Enviar para Walk Finance
    if (WALK_FINANCE_KEY) {
      const financeRes = await fetch(`${WALK_FINANCE_URL}/functions/v1/finance-receber-dados`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${WALK_FINANCE_KEY}`,
          "apikey": WALK_FINANCE_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!financeRes.ok) {
        const err = await financeRes.text();
        await logSync("gia_to_finance", "gia", "walk_finance", 0, 1, "failed", err);
        return jsonResponse({ success: false, error: `Walk Finance error: ${err}`, payload }, 502);
      }
    }

    await logSync("gia_to_finance", "gia", "walk_finance", 1, 0, "completed");

    return jsonResponse({ success: true, payload, synced_to_finance: !!WALK_FINANCE_KEY });
  } catch (e: any) {
    await logSync("gia_to_finance", "gia", "walk_finance", 0, 1, "failed", e.message);
    return errorResponse(e.message, 500);
  }
});
