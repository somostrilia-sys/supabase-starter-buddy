/**
 * gia-gerar-contrato
 * 1. Recebe dados da negociação (sem PDF — gera no servidor)
 * 2. Gera PDF do contrato usando pdf-lib (sem DOM/html2canvas)
 * 3. Cria documento no Autentique (Token Objetivo) com 2 signatários
 * 4. Auto-assina pelo Maikon (Token Maikon) — assinatura da empresa
 * 5. Salva contrato no banco com link do associado
 * 6. Retorna link de assinatura para o frontend
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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
    let detail = text;
    try { detail = JSON.stringify(JSON.parse(text)); } catch {}
    throw new Error(`Autentique HTTP ${resp.status}: ${detail}`);
  }
  return resp.json();
}

// --- Geração do PDF server-side ---
function fmtMoney(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

async function gerarPdfServidor(neg: any, cotacao: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const blue = rgb(0.1, 0.23, 0.36); // #1A3A5C
  const gray = rgb(0.4, 0.4, 0.4);
  const black = rgb(0, 0, 0);
  const lightGray = rgb(0.85, 0.85, 0.85);

  // ── Página 1: Dados do Associado e Veículo ──
  const p1 = pdf.addPage([595.28, 841.89]); // A4
  let y = 800;
  const margin = 50;
  const w = 595.28 - margin * 2;

  // Header
  p1.drawRectangle({ x: 0, y: 820, width: 595.28, height: 22, color: blue });
  p1.drawText("OBJETIVO AUTO BENEFÍCIOS", { x: margin, y: 825, size: 12, font: fontBold, color: rgb(1, 1, 1) });
  p1.drawText("CNPJ: 58.506.161/0001-31", { x: 380, y: 825, size: 9, font, color: rgb(1, 1, 1) });

  y = 795;
  p1.drawText("TERMO DE ADESÃO — PROTEÇÃO VEICULAR ASSOCIATIVA", { x: margin, y, size: 13, font: fontBold, color: blue });

  // Seção: Dados do Associado
  y -= 30;
  p1.drawRectangle({ x: margin, y: y - 2, width: w, height: 16, color: blue });
  p1.drawText("DADOS DO ASSOCIADO", { x: margin + 6, y: y + 1, size: 9, font: fontBold, color: rgb(1, 1, 1) });

  const drawField = (page: any, label: string, value: string, x: number, yy: number, fieldW: number) => {
    page.drawText(label, { x, y: yy, size: 7, font, color: gray });
    page.drawText(value || "—", { x, y: yy - 11, size: 9, font, color: black });
    page.drawLine({ start: { x, y: yy - 14 }, end: { x: x + fieldW, y: yy - 14 }, thickness: 0.3, color: lightGray });
  };

  y -= 30;
  drawField(p1, "Nome Completo", neg.lead_nome || "", margin, y, 250);
  drawField(p1, "CPF/CNPJ", neg.cpf_cnpj || "", margin + 260, y, 230);

  y -= 30;
  drawField(p1, "Telefone", neg.telefone || "", margin, y, 160);
  drawField(p1, "E-mail", neg.email || "", margin + 170, y, 320);

  y -= 30;
  drawField(p1, "Consultor", neg.consultor || "", margin, y, 250);
  drawField(p1, "Regional", neg.regional || "", margin + 260, y, 230);

  // Seção: Dados do Veículo
  y -= 40;
  p1.drawRectangle({ x: margin, y: y - 2, width: w, height: 16, color: blue });
  p1.drawText("DADOS DO VEÍCULO", { x: margin + 6, y: y + 1, size: 9, font: fontBold, color: rgb(1, 1, 1) });

  y -= 30;
  drawField(p1, "Placa", neg.veiculo_placa || "", margin, y, 120);
  drawField(p1, "Modelo", neg.veiculo_modelo || "", margin + 130, y, 250);
  drawField(p1, "Plano", neg.plano || "", margin + 390, y, 100);

  // Preços do cache
  const precos = neg.cache_precos;
  let planoInfo: any = null;
  if (Array.isArray(precos) && precos.length > 0) {
    const planoNome = neg.plano || "";
    planoInfo = precos.find((p: any) =>
      (p.plano_normalizado || p.plano || "").toLowerCase().includes(planoNome.toLowerCase()) ||
      planoNome.toLowerCase().includes((p.plano_normalizado || p.plano || "").toLowerCase())
    ) || precos[0];
  }

  y -= 30;
  drawField(p1, "Valor Mensalidade", planoInfo ? fmtMoney(Number(planoInfo.cota || 0)) : fmtMoney(Number(neg.valor_plano || 0)), margin, y, 160);
  drawField(p1, "Adesão", planoInfo ? fmtMoney(Number(planoInfo.adesao || 0)) : "—", margin + 170, y, 130);
  drawField(p1, "Participação", planoInfo ? `${planoInfo.tipo_franquia || ""} ${planoInfo.valor_franquia || ""}`.trim() || "5% FIPE" : "5% FIPE", margin + 310, y, 180);

  // Coberturas
  y -= 40;
  p1.drawRectangle({ x: margin, y: y - 2, width: w, height: 16, color: blue });
  p1.drawText("COBERTURAS E SERVIÇOS", { x: margin + 6, y: y + 1, size: 9, font: fontBold, color: rgb(1, 1, 1) });

  let coberturas: string[] = [];
  if (cotacao?.todos_planos && Array.isArray(cotacao.todos_planos)) {
    const planoNome = neg.plano || "";
    const match = cotacao.todos_planos.find((p: any) =>
      (p.nome || "").toLowerCase().includes(planoNome.toLowerCase()) ||
      planoNome.toLowerCase().includes((p.nome || "").toLowerCase())
    ) || cotacao.todos_planos[0];
    if (match?.coberturas) {
      coberturas = match.coberturas.filter((c: any) => c.inclusa !== false).map((c: any) => c.cobertura || c.nome);
    }
  }
  if (coberturas.length === 0) {
    coberturas = ["Roubo", "Furto", "Colisão", "Incêndio", "Perda Total", "Assistência 24H", "Reboque", "Chaveiro"];
  }

  y -= 20;
  const colW = 240;
  for (let i = 0; i < coberturas.length; i++) {
    const col = i % 2;
    if (col === 0 && i > 0) y -= 16;
    p1.drawText(`• ${coberturas[i]}`, { x: margin + col * colW, y, size: 8.5, font, color: black });
  }

  // ── Página 2: Termos e Condições ──
  const p2 = pdf.addPage([595.28, 841.89]);
  y = 800;
  p2.drawRectangle({ x: 0, y: 820, width: 595.28, height: 22, color: blue });
  p2.drawText("OBJETIVO AUTO BENEFÍCIOS — TERMOS E CONDIÇÕES", { x: margin, y: 825, size: 10, font: fontBold, color: rgb(1, 1, 1) });

  const termos = [
    "1. O presente Termo de Adesão vincula o ASSOCIADO à ASSOCIAÇÃO DE PROTEÇÃO VEICULAR, mediante o pagamento da taxa de adesão e mensalidades.",
    "2. A proteção veicular cobre os eventos descritos no regulamento da associação, incluindo roubo, furto, colisão, incêndio e perda total, conforme coberturas contratadas.",
    "3. O associado deve manter os pagamentos em dia. O atraso superior a 30 dias poderá resultar na suspensão da cobertura.",
    "4. Em caso de sinistro, o associado deverá comunicar imediatamente e apresentar Boletim de Ocorrência em até 48 horas.",
    "5. A participação do associado (franquia) será conforme tabela vigente na data do sinistro.",
    "6. O veículo deverá estar em boas condições de uso e conservação, conforme vistoria de entrada.",
    "7. Modificações no veículo que alterem suas características originais devem ser comunicadas previamente.",
    "8. A associação se reserva o direito de recusar a adesão de veículos com restrições judiciais ou documentação irregular.",
    "9. O cancelamento da adesão poderá ser solicitado a qualquer momento, respeitando o prazo de carência de 90 dias.",
    "10. Este contrato é regido pelo Código Civil Brasileiro e pelo Estatuto Social da Associação.",
  ];

  y = 790;
  for (const t of termos) {
    const lines = splitText(t, font, 8, w);
    for (const line of lines) {
      p2.drawText(line, { x: margin, y, size: 8, font, color: black });
      y -= 13;
    }
    y -= 6;
  }

  // ── Página 3: Assinaturas ──
  const p3 = pdf.addPage([595.28, 841.89]);
  y = 800;
  p3.drawRectangle({ x: 0, y: 820, width: 595.28, height: 22, color: blue });
  p3.drawText("OBJETIVO AUTO BENEFÍCIOS — ASSINATURAS", { x: margin, y: 825, size: 10, font: fontBold, color: rgb(1, 1, 1) });

  y = 760;
  p3.drawText("Declaro que li e aceito integralmente os termos e condições deste Termo de Adesão.", { x: margin, y, size: 9, font, color: black });
  p3.drawText("Confirmo a veracidade das informações prestadas e autorizo a proteção do veículo descrito.", { x: margin, y: y - 15, size: 9, font, color: black });

  // Data
  y -= 50;
  const hoje = new Date().toLocaleDateString("pt-BR");
  p3.drawText(`Data: ${hoje}`, { x: margin, y, size: 9, font, color: black });

  // Linha assinatura Associado
  y -= 60;
  p3.drawLine({ start: { x: margin, y }, end: { x: margin + 220, y }, thickness: 0.5, color: black });
  p3.drawText(neg.lead_nome || "Associado", { x: margin, y: y - 14, size: 9, font: fontBold, color: black });
  p3.drawText("ASSOCIADO", { x: margin, y: y - 26, size: 7, font, color: gray });

  // Linha assinatura Empresa
  p3.drawLine({ start: { x: margin + 280, y }, end: { x: margin + 500, y }, thickness: 0.5, color: black });
  p3.drawText("Maikon Serrão Coelho", { x: margin + 280, y: y - 14, size: 9, font: fontBold, color: black });
  p3.drawText("OBJETIVO AUTO BENEFÍCIOS", { x: margin + 280, y: y - 26, size: 7, font, color: gray });

  // Hash de autenticação
  y -= 80;
  const hash = `GIA-${Date.now().toString(36).toUpperCase()}`;
  p3.drawText(`Código de autenticação: ${hash}`, { x: margin, y, size: 7, font, color: gray });
  p3.drawText("Documento gerado eletronicamente pelo sistema GIA — Gestão Integrada de Associações", { x: margin, y: y - 12, size: 7, font, color: gray });

  return pdf.save();
}

function splitText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// --- Main handler ---
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const { negociacao_id, canal, pdf_base64, telefone_associado } = body;

    if (!negociacao_id)
      return jsonRes({ sucesso: false, error: "negociacao_id obrigatório" }, 400);

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

    // 3. Gerar ou usar PDF
    let pdfBytes: Uint8Array;
    if (pdf_base64) {
      // Se o frontend enviou PDF pronto, usar ele
      const binaryStr = atob(pdf_base64);
      pdfBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        pdfBytes[i] = binaryStr.charCodeAt(i);
      }
    } else {
      // Gerar PDF no servidor (sem travar o browser)
      const { data: cotacao } = await supabase
        .from("cotacoes" as any)
        .select("todos_planos")
        .eq("negociacao_id", negociacao_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      pdfBytes = await gerarPdfServidor(neg, cotacao);
    }

    const pdfFile = new File(
      [pdfBytes],
      `Contrato-${(neg.lead_nome || "associado").replace(/\s/g, "_")}.pdf`,
      { type: "application/pdf" },
    );

    // 4. Validar email
    const emailAssociado = neg.email || "";
    if (!emailAssociado) {
      return jsonRes({ sucesso: false, error: "E-mail do associado não cadastrado. Preencha na aba Associado." }, 400);
    }

    // 5. Criar documento no Autentique com 2 signatários
    const nomeDoc = `Contrato Proteção Veicular - ${neg.lead_nome || ""} - ${neg.veiculo_placa || ""}`;

    const signers: any[] = [
      { email: maikonEmail, name: maikonNome, action: "SIGN" },
      { email: emailAssociado, name: neg.lead_nome || "Associado", action: "SIGN" },
    ];

    if (telefone_associado && (canal === "whatsapp" || canal === "ambos")) {
      const phone = telefone_associado.replace(/\D/g, "");
      const phoneFormatted = phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
      signers[1].phone_number = phoneFormatted;
      signers[1].delivery_method = "DELIVERY_METHOD_WHATSAPP";
    }

    const createMutation = `
      mutation CreateDocumentMutation(
        $document: DocumentInput!
        $signers: [SignerInput!]!
        $file: Upload!
      ) {
        createDocument(document: $document, signers: $signers, file: $file) {
          id
          name
          created_at
          signatures {
            public_id
            name
            email
            action { name }
            link { short_link }
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
          locale: { country: "BR", language: "PT_BR", timezone: "America/Sao_Paulo", date_format: "DD_MM_YYYY" },
        },
        signers,
        file: null,
      },
    });

    const formData = new FormData();
    formData.append("operations", operations);
    formData.append("map", JSON.stringify({ "0": ["variables.file"] }));
    formData.append("0", pdfFile);

    const createResult = await autentiqueRequest(AUTENTIQUE_TOKEN, formData);

    if (createResult.errors) {
      const err0 = createResult.errors[0];
      console.error("Autentique errors:", JSON.stringify(createResult.errors, null, 2));
      const validationDetail = err0?.extensions?.validation
        ? ` [campos: ${Object.keys(err0.extensions.validation).join(", ")}]`
        : "";
      return jsonRes({
        sucesso: false,
        error: `Erro Autentique: ${err0?.message || "Erro desconhecido"}${validationDetail}`,
        detalhes: err0?.extensions,
      }, 500);
    }

    const doc = createResult?.data?.createDocument;
    if (!doc?.id) {
      return jsonRes({ sucesso: false, error: "Documento não criado no Autentique" }, 500);
    }

    // 6. Auto-assinar pelo Maikon
    try {
      const signForm = new FormData();
      signForm.append("operations", JSON.stringify({ query: `mutation { signDocument(id: "${doc.id}") }` }));
      signForm.append("map", JSON.stringify({}));
      const signResult = await autentiqueRequest(AUTENTIQUE_TOKEN_MAIKON, signForm);
      if (signResult.errors) {
        console.error("Auto-assinatura Maikon falhou:", JSON.stringify(signResult.errors));
        await supabase.from("contratos" as any)
          .update({ autentique_status: "erro_assinatura_empresa" })
          .eq("autentique_document_id", doc.id);
      }
    } catch (e) {
      console.warn("Erro na auto-assinatura do Maikon (não bloqueante):", e);
    }

    // 7. Extrair link de assinatura do associado
    const signatures = doc.signatures || [];
    const sigAssociado = signatures.find((s: any) => s.email === emailAssociado) || signatures[1];
    const linkAssinatura = sigAssociado?.link?.short_link || "";

    // 8. Salvar contrato no banco
    const numero = `CTR-${Date.now().toString(36).toUpperCase()}`;
    const { error: insertErr } = await supabase.from("contratos" as any).insert({
      numero,
      negociacao_id,
      associado_id: neg.associado_id || null,
      valor_mensal: neg.valor_plano || 0,
      status: "aguardando_assinatura",
      tipo: "contrato",
      autentique_document_id: doc.id,
      autentique_link: linkAssinatura,
      autentique_status: "enviado",
    });

    if (insertErr) {
      console.error("Contrato órfão no Autentique:", doc.id, insertErr);
      return jsonRes({
        sucesso: false,
        error: "Contrato criado no Autentique mas falhou ao salvar localmente. ID: " + doc.id,
        autentique_document_id: doc.id,
      }, 500);
    }

    // 9. Registrar evento na timeline
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
