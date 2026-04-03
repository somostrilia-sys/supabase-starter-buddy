// GIA API — Buscar boletos (para CollectPRO)
// Auth: x-api-key com permissão read:boletos

import { validateApiKey, getSupabase, corsHeaders, jsonResponse, errorResponse } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await validateApiKey(req, "read:boletos");
    if (!auth.valid) return errorResponse(auth.error!, 401);

    const url = new URL(req.url);
    const associado_id = url.searchParams.get("associado_id");
    const status = url.searchParams.get("status"); // em_aberto, pago, vencido, negociado
    const vencidos = url.searchParams.get("vencidos") === "true";
    const dias_atraso_min = parseInt(url.searchParams.get("dias_atraso_min") || "0");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 1000);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const supabase = getSupabase();
    let query = supabase
      .from("boletos")
      .select(`
        id, associado_id, valor, vencimento, data_pagamento,
        status, nosso_numero, tipo, referencia, created_at,
        associados!inner(nome, cpf, telefone, email)
      `, { count: "exact" });

    if (associado_id) query = query.eq("associado_id", associado_id);
    if (status) query = query.eq("status", status);

    if (vencidos || dias_atraso_min > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - dias_atraso_min);
      query = query
        .eq("status", "aberto")
        .lt("vencimento", cutoff.toISOString().split("T")[0]);
    }

    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order("vencimento", { ascending: true });

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({ success: true, data, total: count, limit, offset });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
