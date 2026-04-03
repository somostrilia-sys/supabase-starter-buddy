// GIA → Track System — Enviar veículos com rastreador
// Auth: x-api-key com permissão write:vehicles

import { validateApiKey, getSupabase, corsHeaders, jsonResponse, errorResponse, logSync } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await validateApiKey(req, "write:vehicles");
    if (!auth.valid) return errorResponse(auth.error!, 401);

    const url = new URL(req.url);
    const somente_novos = url.searchParams.get("somente_novos") === "true";
    const desde = url.searchParams.get("desde"); // ISO date

    const supabase = getSupabase();

    let query = supabase
      .from("veiculos")
      .select(`
        id, placa, chassi, marca, modelo, ano, valor_fipe,
        categoria_uso, classificacao_uso,
        associados!inner(id, nome, cpf, telefone, email, status)
      `)
      .eq("classificacao_uso", "RASTREADO SIM");

    if (somente_novos && desde) {
      query = query.gte("created_at", desde);
    }

    // Só associados ativos
    query = query.eq("associados.status", "ativo");

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) return errorResponse(error.message, 500);

    const veiculos = (data || []).map((v: any) => ({
      veiculo_id: v.id,
      placa: v.placa,
      chassi: v.chassi,
      marca: v.marca,
      modelo: v.modelo,
      ano: v.ano,
      valor_fipe: v.valor_fipe,
      categoria: v.categoria_uso,
      associado: {
        id: v.associados.id,
        nome: v.associados.nome,
        cpf: v.associados.cpf,
        telefone: v.associados.telefone,
        email: v.associados.email,
        endereco: v.associados.endereco,
      },
    }));

    await logSync("gia_to_track", "gia", "track_system", veiculos.length, 0, "completed");

    return jsonResponse({ success: true, total: veiculos.length, data: veiculos });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
