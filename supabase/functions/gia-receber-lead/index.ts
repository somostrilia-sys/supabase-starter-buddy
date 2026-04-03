// GIA API — Receber lead do LuxSales
// Auth: x-api-key com permissão write:leads

import { validateApiKey, getSupabase, corsHeaders, jsonResponse, errorResponse, logSync } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const auth = await validateApiKey(req, "write:leads");
    if (!auth.valid) return errorResponse(auth.error!, 401);

    const body = await req.json();
    const { nome, telefone, cpf_cnpj, email, veiculo_interesse, veiculo_placa, veiculo_marca, plano_interesse, qualificacao, score, transcript, source_lead_id, dados_extras } = body;

    if (!nome || !telefone) {
      return errorResponse("nome e telefone são obrigatórios");
    }

    const supabase = getSupabase();
    const telNorm = telefone.replace(/\D/g, "");

    // Dedup: verificar se já existe negociação com mesmo telefone
    const { data: existingNeg } = await supabase
      .from("negociacoes")
      .select("id")
      .eq("telefone", telNorm)
      .limit(1)
      .maybeSingle();

    if (existingNeg) {
      // Atualizar negociação existente com dados novos
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (veiculo_placa) updateData.veiculo_placa = veiculo_placa;
      if (veiculo_interesse) updateData.veiculo_modelo = veiculo_interesse;
      if (qualificacao) updateData.observacoes = `[LuxSales VoIP] Qualificação: ${qualificacao} (score: ${score || "N/A"})`;
      await supabase.from("negociacoes").update(updateData).eq("id", existingNeg.id);

      await logSync("lead_import", "luxsales", "gia", 1, 0, "dedup_updated");
      return jsonResponse({
        success: true,
        negociacao_id: existingNeg.id,
        dedup: true,
        message: "Negociação existente atualizada",
      });
    }

    // 1. Salvar em leads_externos
    const { data: externo, error: extErr } = await supabase
      .from("leads_externos")
      .insert({
        source_system: "luxsales",
        source_lead_id: source_lead_id || null,
        nome,
        telefone: telNorm,
        cpf_cnpj: cpf_cnpj ? cpf_cnpj.replace(/\D/g, "") : null,
        email: email || null,
        veiculo_interesse: veiculo_interesse || null,
        plano_interesse: plano_interesse || null,
        qualificacao: qualificacao || null,
        score: score || null,
        transcript: transcript || null,
        dados_extras: dados_extras || null,
      })
      .select()
      .single();

    if (extErr) return errorResponse(extErr.message, 500);

    // 2. Criar lead no pipeline GIA automaticamente (tabela leads - legado)
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        nome,
        telefone: telNorm,
        cpf: cpf_cnpj ? cpf_cnpj.replace(/\D/g, "") : null,
        email: email || null,
        veiculo_interesse: veiculo_interesse || null,
        plano_interesse: plano_interesse || null,
        status: "novo_lead",
        observacoes: qualificacao
          ? `[LuxSales VoIP] Qualificação: ${qualificacao} (score: ${score || "N/A"})`
          : "[LuxSales VoIP] Lead importado automaticamente",
      })
      .select("id")
      .single();

    // Vincular lead GIA ao registro externo
    if (lead?.id) {
      await supabase
        .from("leads_externos")
        .update({ importado: true, importado_em: new Date().toISOString(), lead_id_gia: lead.id })
        .eq("id", externo.id);
    }

    // 3. Criar negociação no pipeline (tabela negociacoes - nova)
    const obs = qualificacao
      ? `[LuxSales VoIP] Qualificação: ${qualificacao} (score: ${score || "N/A"})`
      : "[LuxSales VoIP] Lead importado automaticamente";

    const { data: negociacao, error: negErr } = await supabase
      .from("negociacoes")
      .insert({
        lead_nome: nome,
        telefone: telNorm,
        cpf_cnpj: cpf_cnpj ? cpf_cnpj.replace(/\D/g, "") : null,
        email: email || null,
        veiculo_modelo: veiculo_interesse || null,
        veiculo_placa: veiculo_placa || null,
        stage: "novo_lead",
        origem: "LuxSales VoIP",
        observacoes: obs,
        lead_externo_id: externo.id,
        enviado_sga: false,
        visualizacoes_proposta: 0,
        status_icons: { aceita: false, pendente: true, aprovada: false, sga: false, rastreador: false, inadimplencia: false },
      })
      .select("id")
      .single();

    if (negErr) {
      console.error("[gia-receber-lead] negociacao insert error:", negErr);
    }

    // 4. Registrar transição no pipeline
    if (negociacao?.id) {
      await supabase.from("pipeline_transicoes").insert({
        negociacao_id: negociacao.id,
        stage_anterior: null,
        stage_novo: "novo_lead",
        motivo: "Lead importado automaticamente via LuxSales VoIP",
        automatica: true,
      });
    }

    await logSync("lead_import", "luxsales", "gia", 1, leadErr ? 1 : 0, leadErr ? "partial" : "completed", leadErr?.message);

    return jsonResponse({
      success: true,
      lead_externo_id: externo.id,
      lead_gia_id: lead?.id || null,
      negociacao_id: negociacao?.id || null,
      imported: !!lead?.id,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
