// GIA API — Listar inadimplentes (para CollectPRO)
// Auth: x-api-key com permissão read:inadimplentes
// Nota: boletos do SGA têm vencimento NULL, então filtramos por status='aberto'

import { validateApiKey, getSupabase, corsHeaders, jsonResponse, errorResponse } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await validateApiKey(req, "read:inadimplentes");
    if (!auth.valid) return errorResponse(auth.error!, 401);

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "200"), 1000);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status_assoc = url.searchParams.get("status_associado"); // filtrar por status específico

    const supabase = getSupabase();

    // Buscar boletos em aberto (SGA: status='aberto' = inadimplente)
    const { data: boletos, error: bErr } = await supabase
      .from("boletos")
      .select(`
        id, valor, vencimento, status, referencia,
        associados!inner(id, nome, cpf, telefone, email, status)
      `)
      .eq("status", "aberto");

    if (bErr) return errorResponse(bErr.message, 500);

    // Agrupar por associado
    const grouped: Record<string, any> = {};
    for (const b of boletos || []) {
      const assoc = (b as any).associados;
      if (!assoc?.id) continue;

      // Filtrar por status do associado se fornecido
      if (status_assoc && assoc.status !== status_assoc) continue;

      const key = assoc.id;
      if (!grouped[key]) {
        grouped[key] = {
          associado_id: assoc.id,
          nome: assoc.nome,
          cpf: assoc.cpf,
          telefone: assoc.telefone,
          email: assoc.email,
          status_associado: assoc.status,
          valor_total_devido: 0,
          qtd_boletos_abertos: 0,
          boletos: [],
        };
      }
      grouped[key].valor_total_devido += Number(b.valor) || 0;
      grouped[key].qtd_boletos_abertos += 1;
      grouped[key].boletos.push({
        boleto_id: b.id,
        valor: b.valor,
        vencimento: b.vencimento,
        referencia: b.referencia,
      });
    }

    const inadimplentes = Object.values(grouped)
      .sort((a: any, b: any) => b.valor_total_devido - a.valor_total_devido)
      .slice(offset, offset + limit);

    return jsonResponse({
      success: true,
      total: Object.keys(grouped).length,
      data: inadimplentes,
      limit,
      offset,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
