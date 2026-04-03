// CollectPRO — Gerenciar negativados (SPC/Serasa)
// Lógica: associados com >90 dias de atraso + sem acordo ativo

import { getSupabase, corsHeaders, jsonResponse, errorResponse, logSync } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = getSupabase();

  try {
    if (req.method === "GET") {
      // Listar candidatos a negativação
      const url = new URL(req.url);
      const dias_min = parseInt(url.searchParams.get("dias_atraso_min") || "90");
      const status_filter = url.searchParams.get("status"); // pendente, enviado, confirmado, baixado

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - dias_min);

      // Buscar associados com boletos muito vencidos
      const { data: boletos } = await supabase
        .from("boletos")
        .select(`
          id, valor, data_vencimento,
          associados!inner(id, nome, cpf, telefone, status)
        `)
        .eq("status", "aberto");

      // Agrupar e filtrar quem NÃO tem acordo
      const grouped: Record<string, any> = {};
      for (const b of boletos || []) {
        const a = (b as any).associados;
        if (!a?.id) continue;
        if (!grouped[a.id]) {
          grouped[a.id] = {
            associado_id: a.id,
            nome: a.nome,
            cpf: a.cpf,
            telefone: a.telefone,
            valor_total: 0,
            qtd_boletos: 0,
            dias_atraso_max: 0,
          };
        }
        const dias = Math.floor((Date.now() - new Date(b.vencimento).getTime()) / 86400000);
        grouped[a.id].valor_total += Number(b.valor) || 0;
        grouped[a.id].qtd_boletos += 1;
        grouped[a.id].dias_atraso_max = Math.max(grouped[a.id].dias_atraso_max, dias);
      }

      // Verificar quem já tem acordo ativo
      const ids = Object.keys(grouped);
      if (ids.length > 0) {
        const { data: acordos } = await supabase
          .from("cobranca_status")
          .select("associado_id, status")
          .in("associado_id", ids)
          .eq("status", "acordo");

        const comAcordo = new Set((acordos || []).map((a) => a.associado_id));
        for (const id of comAcordo) delete grouped[id];
      }

      const candidatos = Object.values(grouped).sort((a: any, b: any) => b.valor_total - a.valor_total);

      return jsonResponse({
        success: true,
        total_candidatos: candidatos.length,
        dias_atraso_minimo: dias_min,
        data: candidatos,
      });
    }

    if (req.method === "POST") {
      // Registrar negativação
      const { associado_id, cpf_cnpj, valor_total, bureau, acao } = await req.json();

      if (!associado_id || !acao) {
        return errorResponse("associado_id e acao são obrigatórios");
      }

      if (acao === "negativar") {
        // Marcar como negativado
        await supabase.from("cobranca_status").upsert(
          {
            associado_id,
            status: "negativado",
            negativado: true,
            negativado_em: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "associado_id" },
        );

        await supabase
          .from("associados")
          .update({ situacao: "inadimplente" })
          .eq("id", associado_id);

        await logSync("negativacao", "collect_pro", bureau || "spc", 1, 0, "completed");

        return jsonResponse({ success: true, acao: "negativado", associado_id });
      }

      if (acao === "baixar") {
        // Baixar negativação
        await supabase.from("cobranca_status").upsert(
          {
            associado_id,
            negativado: false,
            status: "acordo",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "associado_id" },
        );

        await logSync("baixa_negativacao", "collect_pro", bureau || "spc", 1, 0, "completed");

        return jsonResponse({ success: true, acao: "baixado", associado_id });
      }

      return errorResponse("acao deve ser 'negativar' ou 'baixar'");
    }

    return errorResponse("Method not allowed", 405);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
