// GIA API pública pro Trilho Assist (Assistência 24h)
// Spec: Especificacao_Integracao_GIA_TrilhoAssist.pdf (v1)
//
// Endpoints:
//   GET /gia-api-trilhoassist/associados?page=&page_size=&updated_since=
//   GET /gia-api-trilhoassist/veiculos?page=&page_size=&updated_since=
//   GET /gia-api-trilhoassist/veiculos/placa/:placa
//   GET /gia-api-trilhoassist/associados/cpf/:cpf
//   GET /gia-api-trilhoassist/produtos?page=&page_size=
//   GET /gia-api-trilhoassist/health
//
// Auth:
//   Authorization: Bearer <TOKEN>  ou  x-api-key: <TOKEN>
//   Token registrado em public.api_keys com permissão read:associados + read:veiculos.
//
// Todas as respostas são JSON UTF-8. Soft-delete preservado via `ativo=false`.

import { validateApiKey, getSupabase, corsHeaders, jsonResponse, errorResponse } from "../_shared/auth.ts";

const MAX_PAGE_SIZE = 1000;

// --- Mapeamentos ---
function mapAssociadoStatus(s: string | null): "ativo" | "inativo" | "suspenso" {
  const v = (s || "").toLowerCase();
  if (v === "ativo") return "ativo";
  if (v === "congelado" || v === "suspenso") return "suspenso";
  if (v === "pendente") return "suspenso"; // ainda não liberado
  return "inativo";
}

function onlyDigits(s: string | null | undefined): string {
  return (s || "").replace(/\D/g, "");
}

function normalizePlaca(s: string | null | undefined): string {
  return (s || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

// --- Auth: aceita Bearer OU x-api-key ---
async function authenticate(req: Request, requiredPerm: string) {
  // Copia Bearer -> x-api-key pra reutilizar validateApiKey
  const bearer = req.headers.get("authorization");
  if (bearer?.toLowerCase().startsWith("bearer ")) {
    const token = bearer.slice(7).trim();
    const proxied = new Request(req.url, {
      method: req.method,
      headers: { ...Object.fromEntries(req.headers), "x-api-key": token },
    });
    return validateApiKey(proxied, requiredPerm);
  }
  return validateApiKey(req, requiredPerm);
}

// --- Helpers de serialização ---
async function fetchCoopMap(supabase: ReturnType<typeof getSupabase>, ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from("cooperativas").select("id, nome").in("id", unique);
  return new Map((data || []).map((r: any) => [r.id, r.nome]));
}

async function fetchPlanosByVeiculo(
  supabase: ReturnType<typeof getSupabase>,
  veiculos: { id: string; grupo_id: string | null }[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  const grupoIds = [...new Set(veiculos.map((v) => v.grupo_id).filter((x): x is string => !!x))];
  if (grupoIds.length === 0) return map;
  const { data } = await supabase.from("grupos_produtos").select("id, nome").in("id", grupoIds);
  const grupoNomes = new Map((data || []).map((r: any) => [r.id, r.nome]));
  for (const v of veiculos) {
    const nome = v.grupo_id ? grupoNomes.get(v.grupo_id) : null;
    map.set(v.id, nome ? [nome] : []);
  }
  return map;
}

function serializeAssociado(row: any, coopMap: Map<string, string>, planosByAssoc?: string[]) {
  return {
    id: row.id,
    nome: row.nome,
    cpf: row.cpf || null,
    telefone: onlyDigits(row.telefone) || null,
    email: row.email || null,
    status: mapAssociadoStatus(row.status),
    plano: (planosByAssoc && planosByAssoc[0]) || null,
    planos: planosByAssoc || [],
    cooperativa: row.cooperativa_id ? coopMap.get(row.cooperativa_id) || null : null,
    cooperativa_id: row.cooperativa_id || null,
    data_adesao: row.data_contrato_sga || row.created_at?.slice(0, 10) || null,
    data_atualizacao: row.updated_at,
  };
}

function serializeVeiculo(row: any, planos?: string[]) {
  return {
    id: row.id,
    associado_id: row.associado_id,
    placa: row.placa ? normalizePlaca(row.placa) : null,
    marca: row.marca || null,
    modelo: row.modelo || null,
    ano: row.ano || null,
    chassi: row.chassi || null,
    cor: row.cor || null,
    categoria: row.categoria_uso || row.tipo_utilizacao || null,
    ativo: String(row.situacao || "").toLowerCase() === "ativo",
    plano: (planos && planos[0]) || null,
    planos: planos || [],
    data_atualizacao: row.updated_at,
  };
}

// --- Handlers ---
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  // path dentro da edge: tudo depois de "/gia-api-trilhoassist"
  const fullPath = url.pathname;
  const match = fullPath.match(/\/gia-api-trilhoassist(\/.*)?$/);
  const path = (match?.[1] || "/").replace(/\/+$/, "") || "/";

  // Health check não exige auth
  if (path === "/health") {
    return jsonResponse({ ok: true, service: "gia-api-trilhoassist", ts: new Date().toISOString() });
  }

  // Auth
  const reqPerm =
    path.startsWith("/veiculos") ? "read:veiculos" :
    path.startsWith("/produtos") ? "read:produtos" :
    "read:associados";
  const auth = await authenticate(req, reqPerm);
  if (!auth.valid) return errorResponse(auth.error!, 401);

  const supabase = getSupabase();

  try {
    // ───── /associados ─────
    if (path === "/associados") {
      const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
      const pageSize = Math.min(parseInt(url.searchParams.get("page_size") || "1000"), MAX_PAGE_SIZE);
      const updatedSince = url.searchParams.get("updated_since");

      let q = supabase
        .from("associados")
        .select("id, nome, cpf, telefone, email, status, cooperativa_id, created_at, updated_at, data_contrato_sga", { count: "exact" });
      if (updatedSince) q = q.gte("updated_at", updatedSince);

      const from = (page - 1) * pageSize;
      const { data, count, error } = await q.order("updated_at", { ascending: false }).range(from, from + pageSize - 1);
      if (error) return errorResponse(error.message, 500);

      const coopMap = await fetchCoopMap(supabase, (data || []).map((r: any) => r.cooperativa_id));

      // Planos por associado via veiculos.grupo_id
      const assocIds = (data || []).map((r: any) => r.id);
      const planosByAssoc = new Map<string, string[]>();
      if (assocIds.length > 0) {
        const { data: veics } = await supabase
          .from("veiculos")
          .select("id, associado_id, grupo_id")
          .in("associado_id", assocIds);
        const vpMap = await fetchPlanosByVeiculo(supabase, (veics || []) as any[]);
        for (const v of (veics || []) as any[]) {
          const planos = vpMap.get(v.id) || [];
          const cur = planosByAssoc.get(v.associado_id) || [];
          for (const p of planos) if (!cur.includes(p)) cur.push(p);
          planosByAssoc.set(v.associado_id, cur);
        }
      }

      const rows = (data || []).map((r: any) => serializeAssociado(r, coopMap, planosByAssoc.get(r.id) || []));
      return jsonResponse({ page, page_size: pageSize, total: count ?? 0, data: rows });
    }

    // ───── /associados/cpf/:cpf ─────
    const cpfMatch = path.match(/^\/associados\/cpf\/(\d{11})$/);
    if (cpfMatch) {
      const cpf = cpfMatch[1];
      const { data: assoc, error } = await supabase
        .from("associados")
        .select("id, nome, cpf, telefone, email, status, cooperativa_id, created_at, updated_at, data_contrato_sga")
        .eq("cpf", cpf)
        .maybeSingle();
      if (error) return errorResponse(error.message, 500);
      if (!assoc) return errorResponse("Associado não encontrado", 404);

      const coopMap = await fetchCoopMap(supabase, [assoc.cooperativa_id]);
      const { data: veics } = await supabase
        .from("veiculos")
        .select("id, associado_id, placa, marca, modelo, ano, chassi, cor, situacao, updated_at, grupo_id, categoria_uso, tipo_utilizacao")
        .eq("associado_id", assoc.id);
      const planosMap = await fetchPlanosByVeiculo(supabase, (veics || []) as any[]);
      const assocPlanos = [...new Set((veics || []).flatMap((v: any) => planosMap.get(v.id) || []))];

      return jsonResponse({
        ...serializeAssociado(assoc, coopMap, assocPlanos),
        veiculos: (veics || []).map((v: any) => serializeVeiculo(v, planosMap.get(v.id) || [])),
      });
    }

    // ───── /veiculos ─────
    if (path === "/veiculos") {
      const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
      const pageSize = Math.min(parseInt(url.searchParams.get("page_size") || "1000"), MAX_PAGE_SIZE);
      const updatedSince = url.searchParams.get("updated_since");

      let q = supabase
        .from("veiculos")
        .select("id, associado_id, placa, marca, modelo, ano, chassi, cor, situacao, updated_at, grupo_id, categoria_uso, tipo_utilizacao", { count: "exact" });
      if (updatedSince) q = q.gte("updated_at", updatedSince);

      const from = (page - 1) * pageSize;
      const { data, count, error } = await q.order("updated_at", { ascending: false }).range(from, from + pageSize - 1);
      if (error) return errorResponse(error.message, 500);

      const planosMap = await fetchPlanosByVeiculo(supabase, (data || []) as any[]);
      const rows = (data || []).map((r: any) => serializeVeiculo(r, planosMap.get(r.id) || []));
      return jsonResponse({ page, page_size: pageSize, total: count ?? 0, data: rows });
    }

    // ───── /veiculos/placa/:placa ─────
    const placaMatch = path.match(/^\/veiculos\/placa\/([A-Z0-9]+)$/i);
    if (placaMatch) {
      const placa = normalizePlaca(placaMatch[1]);
      const { data: veic, error } = await supabase
        .from("veiculos")
        .select("id, associado_id, placa, marca, modelo, ano, chassi, cor, situacao, updated_at, grupo_id, categoria_uso, tipo_utilizacao")
        .eq("placa", placa)
        .maybeSingle();
      if (error) return errorResponse(error.message, 500);
      if (!veic) return errorResponse("Veículo não encontrado", 404);

      const planosMap = await fetchPlanosByVeiculo(supabase, [veic as any]);
      const { data: assoc } = await supabase
        .from("associados")
        .select("id, nome, cpf, telefone, email, status, cooperativa_id, created_at, updated_at, data_contrato_sga")
        .eq("id", veic.associado_id)
        .maybeSingle();
      const coopMap = await fetchCoopMap(supabase, [assoc?.cooperativa_id]);

      return jsonResponse({
        ...serializeVeiculo(veic, planosMap.get(veic.id) || []),
        associado: assoc ? serializeAssociado(assoc, coopMap, planosMap.get(veic.id) || []) : null,
      });
    }

    // ───── /produtos (catálogo de serviços) ─────
    if (path === "/produtos") {
      const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
      const pageSize = Math.min(parseInt(url.searchParams.get("page_size") || "1000"), MAX_PAGE_SIZE);

      const from = (page - 1) * pageSize;
      const { data, count, error } = await supabase
        .from("produtos_gia")
        .select("id, nome, classificacao, tipo, ativo, valor, descricao, updated_at", { count: "exact" })
        .range(from, from + pageSize - 1)
        .order("nome");
      if (error) return errorResponse(error.message, 500);

      const rows = (data || []).map((r: any) => ({
        id: r.id,
        nome: r.nome,
        classificacao: r.classificacao, // cobertura|assistencia|beneficio|opcional
        tipo_veiculo: r.tipo || null,
        descricao: r.descricao || null,
        valor: r.valor ?? null,
        ativo: r.ativo,
        data_atualizacao: r.updated_at,
      }));
      return jsonResponse({ page, page_size: pageSize, total: count ?? 0, data: rows });
    }

    return errorResponse(`Endpoint ${req.method} ${path} não encontrado`, 404);
  } catch (e: any) {
    console.error("[gia-api-trilhoassist]", e);
    return errorResponse(e.message, 500);
  }
});
