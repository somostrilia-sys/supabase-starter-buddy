// GIA API — Atualizar status de cobrança (CollectPRO → GIA)
// Auth: x-api-key com permissão write:cobranca_status

import { validateApiKey, getSupabase, corsHeaders, jsonResponse, errorResponse, logSync } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const auth = await validateApiKey(req, "write:cobranca_status");
    if (!auth.valid) return errorResponse(auth.error!, 401);

    const body = await req.json();
    const {
      associado_id,
      boleto_id,
      status, // contatado, acordo, pago, inadimplente, negativado
      canal, // whatsapp_meta, voip, sms, email
      acordo_valor,
      acordo_parcelas,
      negativado,
    } = body;

    if (!associado_id || !status) {
      return errorResponse("associado_id e status são obrigatórios");
    }

    const supabase = getSupabase();

    // Upsert cobranca_status
    const { data, error } = await supabase
      .from("cobranca_status")
      .upsert(
        {
          associado_id,
          boleto_id: boleto_id || null,
          status,
          canal: canal || null,
          tentativas: body.tentativas || 1,
          ultimo_contato: new Date().toISOString(),
          acordo_valor: acordo_valor || null,
          acordo_parcelas: acordo_parcelas || null,
          negativado: negativado || false,
          negativado_em: negativado ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "associado_id" },
      )
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);

    // Se status = pago, atualizar boleto
    if (status === "pago" && boleto_id) {
      await supabase
        .from("boletos")
        .update({ status: "baixado", data_pagamento: new Date().toISOString().split("T")[0], data_baixa: new Date().toISOString() })
        .eq("id", boleto_id);
    }

    // Se status = acordo, atualizar situação do associado
    if (status === "acordo" || status === "pago") {
      await supabase
        .from("associados")
        .update({ status: "ativo" })
        .eq("id", associado_id);
    }

    // Se negativado
    if (negativado) {
      await supabase
        .from("associados")
        .update({ status: "inadimplente" })
        .eq("id", associado_id);
    }

    await logSync("cobranca_update", "collect_pro", "gia", 1, 0, "completed");

    return jsonResponse({ success: true, data });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
