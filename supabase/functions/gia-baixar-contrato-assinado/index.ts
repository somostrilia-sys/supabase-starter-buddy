/**
 * gia-baixar-contrato-assinado
 * Busca o PDF assinado no Autentique usando o autentique_document_id do contrato
 * e retorna base64 para download no frontend.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const AUTENTIQUE_URL = "https://api.autentique.com.br/v2/graphql";

async function autentiqueQuery(token: string, query: string): Promise<any> {
  const form = new FormData();
  form.append("operations", JSON.stringify({ query }));
  form.append("map", JSON.stringify({}));
  const resp = await fetch(AUTENTIQUE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!resp.ok) {
    throw new Error(`Autentique HTTP ${resp.status}: ${await resp.text()}`);
  }
  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { contrato_id, negociacao_id } = await req.json();
    if (!contrato_id && !negociacao_id) {
      return jsonRes({ sucesso: false, error: "contrato_id ou negociacao_id obrigatório" }, 400);
    }

    const AUTENTIQUE_TOKEN = Deno.env.get("AUTENTIQUE_TOKEN");
    if (!AUTENTIQUE_TOKEN) {
      return jsonRes({ sucesso: false, error: "AUTENTIQUE_TOKEN não configurado" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Buscar contrato (preferir contrato_id; fallback para último da negociação)
    let query = supabase.from("contratos" as any).select("id, autentique_document_id, autentique_status, status");
    if (contrato_id) query = query.eq("id", contrato_id);
    else query = query.eq("negociacao_id", negociacao_id).order("created_at", { ascending: false }).limit(1);
    const { data: contratoRaw, error: cErr } = await query.maybeSingle();
    const contrato = contratoRaw as any;

    if (cErr || !contrato) {
      return jsonRes({ sucesso: false, error: "Contrato não encontrado" }, 404);
    }
    if (!contrato.autentique_document_id) {
      return jsonRes({ sucesso: false, error: "Contrato sem document_id no Autentique" }, 400);
    }

    // Query Autentique — files.signed só estará disponível após assinatura concluída
    const gqlQuery = `query { document(id: "${contrato.autentique_document_id}") { id name files { original signed } } }`;
    const result = await autentiqueQuery(AUTENTIQUE_TOKEN, gqlQuery);

    if (result.errors) {
      return jsonRes({
        sucesso: false,
        error: `Autentique: ${result.errors[0]?.message || "erro desconhecido"}`,
      }, 500);
    }

    const doc = result?.data?.document;
    const signedUrl = doc?.files?.signed;
    const originalUrl = doc?.files?.original;
    const urlToUse = signedUrl || originalUrl;

    if (!urlToUse) {
      return jsonRes({
        sucesso: false,
        error: "Documento ainda não possui versão disponível no Autentique",
      }, 404);
    }

    // Baixar o PDF
    const pdfResp = await fetch(urlToUse, {
      headers: { Authorization: `Bearer ${AUTENTIQUE_TOKEN}` },
    });
    if (!pdfResp.ok) {
      return jsonRes({
        sucesso: false,
        error: `Falha ao baixar PDF do Autentique: HTTP ${pdfResp.status}`,
      }, 500);
    }
    const pdfBytes = new Uint8Array(await pdfResp.arrayBuffer());

    // Converter para base64
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...pdfBytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);

    return jsonRes({
      sucesso: true,
      pdf_base64: base64,
      filename: `${doc.name || "contrato-assinado"}.pdf`,
      assinado: !!signedUrl,
      status: contrato.autentique_status,
    });
  } catch (err) {
    console.error("gia-baixar-contrato-assinado error:", err);
    return jsonRes(
      { sucesso: false, error: err instanceof Error ? err.message : "Erro interno" },
      500,
    );
  }
});
