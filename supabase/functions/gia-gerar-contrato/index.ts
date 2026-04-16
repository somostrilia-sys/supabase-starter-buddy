/**
 * gia-gerar-contrato
 * 1. Recebe PDF base64 + dados da negociação
 * 2. Cria documento no Autentique (Token Objetivo) com 2 signatários
 * 3. Auto-assina pelo Maikon (Token Maikon) — assinatura da empresa
 * 4. Salva contrato no banco com link do associado
 * 5. Retorna link de assinatura para o frontend
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const AUTENTIQUE_URL = "https://api.autentique.com.br/v2/graphql";

async function autentiqueRequest(token: string, formData: FormData) {
  const resp = await fetch(AUTENTIQUE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Autentique HTTP ${resp.status}: ${text}`);
  }
  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { negociacao_id, canal, pdf_base64, telefone_associado } =
      await req.json();

    if (!negociacao_id)
      return jsonRes({ sucesso: false, error: "negociacao_id obrigatório" }, 400);
    if (!pdf_base64)
      return jsonRes({ sucesso: false, error: "pdf_base64 obrigatório" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const AUTENTIQUE_TOKEN = Deno.env.get("AUTENTIQUE_TOKEN");
    const AUTENTIQUE_TOKEN_MAIKON = Deno.env.get("AUTENTIQUE_TOKEN_MAIKON");

    if (!AUTENTIQUE_TOKEN || !AUTENTIQUE_TOKEN_MAIKON) {
      return jsonRes({ sucesso: false, error: "Tokens Autentique não configurados" }, 500);
    }

    // 1. Buscar negociação
    const { data: neg, error: negErr } = await supabase
      .from("negociacoes")
      .select("*")
      .eq("id", negociacao_id)
      .single();

    if (negErr || !neg) {
      return jsonRes({ sucesso: false, error: "Negociação não encontrada" }, 404);
    }

    // 2. Dados do Maikon (representante da empresa)
    const maikonEmail = "diretoria@objetivoauto.com.br";
    const maikonNome = "Maikon Serrão Coelho";

    // 3. Converter base64 para File
    const binaryStr = atob(pdf_base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const pdfFile = new File(
      [bytes],
      `Contrato-${(neg.lead_nome || "associado").replace(/\s/g, "_")}.pdf`,
      { type: "application/pdf" },
    );

    // 4. Criar documento no Autentique com 2 signatários
    const emailAssociado = neg.email || "";
    if (!emailAssociado) {
      return jsonRes({ sucesso: false, error: "E-mail do associado não cadastrado. Preencha na aba Associado." }, 400);
    }

    const nomeDoc = `Contrato Proteção Veicular - ${neg.lead_nome || ""} - ${neg.veiculo_placa || ""}`;

    const signers: any[] = [
      {
        email: maikonEmail,
        action: "SIGN",
      },
      {
        email: emailAssociado,
        action: "SIGN",
      },
    ];

    // Se tiver telefone e canal whatsapp, adicionar delivery_method
    if (telefone_associado && (canal === "whatsapp" || canal === "ambos")) {
      const phone = telefone_associado.replace(/\D/g, "");
      const phoneFormatted = phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
      signers[1].phone = phoneFormatted;
      signers[1].delivery_method = "DELIVERY_METHOD_WHATSAPP";
    }

    const createMutation = `
      mutation CreateDocumentMutation(
        $document: DocumentInput!
        $signers: [SignerInput!]!
        $file: Upload!
      ) {
        createDocument(
          document: $document
          signers: $signers
          file: $file
        ) {
          id
          name
          created_at
          signatures {
            public_id
            name
            email
            action { name }
            link { short_link }
            user { id name email }
          }
        }
      }
    `;

    const operations = JSON.stringify({
      query: createMutation,
      variables: {
        document: {
          name: nomeDoc,
          message: `Prezado(a) ${neg.lead_nome}, segue o contrato de proteção veicular para assinatura.`,
          reminder: "DAILY",
          footer: "BOTTOM",
          refusable: true,
          new_signature_style: true,
          show_audit_page: true,
          locale: {
            country: "BR",
            language: "pt-BR",
            timezone: "America/Sao_Paulo",
            date_format: "DD_MM_YYYY",
          },
        },
        signers,
        file: null,
      },
    });

    const map = JSON.stringify({ "0": ["variables.file"] });

    const formData = new FormData();
    formData.append("operations", operations);
    formData.append("map", map);
    formData.append("0", pdfFile);

    const createResult = await autentiqueRequest(AUTENTIQUE_TOKEN, formData);

    if (createResult.errors) {
      console.error("Autentique errors:", JSON.stringify(createResult.errors));
      return jsonRes({
        sucesso: false,
        error: `Erro Autentique: ${createResult.errors[0]?.message || "Erro desconhecido"}`,
      }, 500);
    }

    const doc = createResult?.data?.createDocument;
    if (!doc?.id) {
      return jsonRes({ sucesso: false, error: "Documento não criado no Autentique" }, 500);
    }

    // 5. Auto-assinar pelo Maikon (representante da empresa)
    try {
      const signForm = new FormData();
      signForm.append(
        "operations",
        JSON.stringify({
          query: `mutation { signDocument(id: "${doc.id}") }`,
        }),
      );
      signForm.append("map", JSON.stringify({}));
      const signResult = await autentiqueRequest(AUTENTIQUE_TOKEN_MAIKON, signForm);
      if (signResult.errors) {
        console.warn("Auto-assinatura Maikon:", JSON.stringify(signResult.errors));
      }
    } catch (e) {
      console.warn("Erro na auto-assinatura do Maikon (não bloqueante):", e);
    }

    // 6. Extrair link de assinatura do associado (segundo signatário)
    const signatures = doc.signatures || [];
    const sigAssociado = signatures.find(
      (s: any) => s.email === (neg.email || "") || s.email !== maikonEmail,
    );
    const linkAssinatura = sigAssociado?.link?.short_link || signatures[1]?.link?.short_link || "";

    // 7. Salvar contrato no banco
    const numero = `CTR-${Date.now().toString(36).toUpperCase()}`;
    const { error: insertErr } = await supabase.from("contratos" as any).insert({
      numero,
      negociacao_id,
      associado_id: neg.associado_id || null,
      plano_id: null,
      veiculo_id: null,
      valor_mensal: neg.valor_mensal || 0,
      status: "aguardando_assinatura",
      tipo: "contrato",
      autentique_document_id: doc.id,
      autentique_link: linkAssinatura,
      autentique_status: "enviado",
    });

    if (insertErr) {
      console.error("Erro ao salvar contrato:", insertErr);
      // Não bloqueia — o documento já foi criado no Autentique
    }

    // 8. Registrar evento na timeline
    await supabase.from("pipeline_transicoes").insert({
      negociacao_id,
      stage_anterior: neg.stage || "assinatura",
      stage_novo: "assinatura",
      motivo: `Contrato enviado para assinatura digital via ${canal}`,
      automatica: true,
      usuario_nome: "Sistema",
    }).catch(() => {});

    return jsonRes({
      sucesso: true,
      link_assinatura: linkAssinatura,
      autentique_document_id: doc.id,
      assinante_empresa: maikonNome,
    });
  } catch (err) {
    console.error("gia-gerar-contrato error:", err);
    return jsonRes(
      { sucesso: false, error: err instanceof Error ? err.message : "Erro interno" },
      500,
    );
  }
});
