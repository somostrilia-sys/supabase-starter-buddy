// GIA API — Buscar associados (para CollectPRO, Assist, Track)
// Auth: x-api-key com permissão read:associados

import { validateApiKey, getSupabase, corsHeaders, jsonResponse, errorResponse } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await validateApiKey(req, "read:associados");
    if (!auth.valid) return errorResponse(auth.error!, 401);

    const url = new URL(req.url);
    const cpf = url.searchParams.get("cpf");
    const telefone = url.searchParams.get("telefone");
    const placa = url.searchParams.get("placa");
    const codigo = url.searchParams.get("codigo");
    const situacao = url.searchParams.get("situacao");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const supabase = getSupabase();
    let query = supabase
      .from("associados")
      .select("id, codigo_sga, nome, cpf, telefone, email, status, created_at", { count: "exact" });

    if (cpf) query = query.eq("cpf", cpf.replace(/\D/g, ""));
    if (telefone) query = query.eq("telefone", telefone.replace(/\D/g, ""));
    if (codigo) query = query.eq("codigo_sga", codigo);
    if (situacao) query = query.eq("status", situacao);
    if (placa) {
      const { data: veic } = await supabase
        .from("veiculos")
        .select("associado_id")
        .ilike("placa", placa.replace(/\s/g, "").toUpperCase())
        .maybeSingle();
      if (veic?.associado_id) {
        query = query.eq("id", veic.associado_id);
      } else {
        return jsonResponse({ success: true, data: [], total: 0 });
      }
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1).order("nome");

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({ success: true, data, total: count, limit, offset, source: auth.keyName });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
