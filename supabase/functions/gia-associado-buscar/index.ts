import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SGA_BASE = "https://api.hinova.com.br/api/sga/v2";
const SGA_TOKEN = "cTnhRGJlN2NjOWQ4M2YyYzRlNjE5YjQ4NzZjNmNhMDY=";

function normalizePhone(v: string) { return v.replace(/\D/g, ""); }
function normalizeCPF(v: string) { return v.replace(/\D/g, ""); }

function unifyAssociado(raw: any, source: string): object {
  return {
    id: raw.id || raw.codigo || null,
    nome: raw.nome || null,
    cpf_cnpj: raw.cpf_cnpj || raw.cpf || null,
    telefone: raw.telefone || raw.celular || null,
    email: raw.email || null,
    veiculos: raw.veiculos || raw.vehicle_documents || [],
    situacao: raw.situacao || null,
    company_id: raw.company_id || null,
    _source: source,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { cpf_cnpj, telefone, placa } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Buscar no banco local
    let query = supabase
      .from("associados")
      .select("*, veiculos:vehicle_documents(placa,modelo,ano)");

    if (cpf_cnpj) {
      query = query.eq("cpf_cnpj", normalizeCPF(cpf_cnpj));
    } else if (telefone) {
      query = query.eq("telefone", normalizePhone(telefone));
    } else if (placa) {
      // join via vehicle_documents
      const { data: veiculo } = await supabase
        .from("vehicle_documents")
        .select("associado_id")
        .ilike("placa", placa.replace(/\s/g, "").toUpperCase())
        .maybeSingle();
      if (veiculo?.associado_id) {
        query = query.eq("id", veiculo.associado_id);
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // force no result
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Informe cpf_cnpj, telefone ou placa" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const { data: local } = await query.maybeSingle();

    if (local) {
      return new Response(
        JSON.stringify({ success: true, data: unifyAssociado(local, "local") }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    // 2. Fallback SGA API
    const sgaBody: Record<string, string> = {};
    if (cpf_cnpj) sgaBody.cpf_cnpj = normalizeCPF(cpf_cnpj);
    else if (telefone) sgaBody.telefone = normalizePhone(telefone);
    // placa: SGA não suporta busca por placa diretamente, retorna null

    if (Object.keys(sgaBody).length === 0) {
      return new Response(
        JSON.stringify({ success: false, data: null, error: "Placa não encontrada localmente e SGA não suporta busca por placa" }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const sgaRes = await fetch(`${SGA_BASE}/listar/associado`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": SGA_TOKEN,
      },
      body: JSON.stringify(sgaBody),
    });

    const sgaData = await sgaRes.json().catch(() => ({}));
    const assoc = sgaData?.lista?.[0] || sgaData?.data?.[0] || null;

    if (assoc) {
      // cachear localmente (best effort)
      await supabase.from("associados").upsert(
        {
          codigo_sga: assoc.codigo,
          nome: assoc.nome,
          cpf_cnpj: normalizeCPF(cpf_cnpj || assoc.cpf_cnpj || ""),
          telefone: normalizePhone(assoc.telefone || assoc.celular || ""),
          email: assoc.email,
          situacao: assoc.situacao === "A" ? "ativo" : "inativo",
          dados_sga: assoc,
        },
        { onConflict: "codigo_sga", ignoreDuplicates: false },
      );
    }

    return new Response(
      JSON.stringify({ success: !!assoc, data: assoc ? unifyAssociado(assoc, "sga") : null }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
