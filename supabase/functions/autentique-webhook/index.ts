/**
 * autentique-webhook
 * Recebe callbacks do Autentique quando documentos são visualizados,
 * assinados, rejeitados ou finalizados.
 * Atualiza status do contrato e registra na timeline.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-autentique-signature",
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function verifySignature(
  payload: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const calculated = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return calculated === signature;
}

const STATUS_MAP: Record<string, string> = {
  "signature.viewed": "visualizado",
  "signature.accepted": "parcialmente_assinado",
  "signature.signed": "parcialmente_assinado",
  "signature.rejected": "rejeitado",
  "document.finished": "concluido",
  "signature.delivery_failed": "erro_envio",
};

const DESCRICAO_MAP: Record<string, string> = {
  "signature.viewed": "Documento visualizado pelo signatário",
  "signature.accepted": "Documento assinado pelo signatário",
  "signature.signed": "Documento assinado pelo signatário",
  "signature.rejected": "Assinatura recusada pelo signatário",
  "document.finished": "Todas as assinaturas concluídas",
  "signature.delivery_failed": "Falha na entrega do email ao signatário",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // Validar assinatura HMAC (obrigatório)
    const secret = Deno.env.get("AUTENTIQUE_WEBHOOK_SECRET");
    if (!secret) {
      console.error("AUTENTIQUE_WEBHOOK_SECRET não configurado — rejeitando");
      return jsonRes({ ok: false, error: "Webhook mal configurado" }, 500);
    }
    const hmacSig = req.headers.get("x-autentique-signature");
    const valid = await verifySignature(rawBody, hmacSig, secret);
    if (!valid) {
      console.warn("Webhook signature inválida");
      return jsonRes({ ok: false, error: "Invalid signature" }, 401);
    }

    const eventType = payload?.event?.type;
    if (!eventType) {
      return jsonRes({ ok: true, skipped: "no event type" });
    }

    const newStatus = STATUS_MAP[eventType];
    if (!newStatus) {
      return jsonRes({ ok: true, skipped: `event ${eventType} not handled` });
    }

    // Extrair document ID do evento
    const docData = payload?.event?.data?.object;
    const documentId = docData?.id;
    if (!documentId) {
      return jsonRes({ ok: true, skipped: "no document id" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Buscar contrato pelo autentique_document_id
    const { data: contrato, error: cErr } = await supabase
      .from("contratos" as any)
      .select("id, negociacao_id, autentique_status")
      .eq("autentique_document_id", documentId)
      .maybeSingle();

    if (cErr || !contrato) {
      console.warn(`Contrato não encontrado para document_id ${documentId}`);
      return jsonRes({ ok: true, skipped: "contract not found" });
    }

    // Atualizar status do contrato
    await supabase
      .from("contratos" as any)
      .update({ autentique_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", contrato.id);

    // Registrar evento na timeline
    const signerSig = payload?.event?.data?.signature ||
      docData?.signatures?.find((s: any) => s.viewed_at || s.signed_at || s.rejected_at);
    const signerName = signerSig?.name || "";
    const signerEmail = signerSig?.email || "";

    const descricao = `${DESCRICAO_MAP[eventType] || eventType}${signerName ? ` (${signerName})` : ""}${signerEmail ? ` - ${signerEmail}` : ""}`;

    await supabase
      .from("pipeline_transicoes")
      .insert({
        negociacao_id: contrato.negociacao_id,
        stage_anterior: "assinatura",
        stage_novo: newStatus === "concluido" ? "venda_concretizada" : "assinatura",
        motivo: descricao,
        automatica: true,
        usuario_nome: "Autentique Webhook",
      })
      .catch(() => {});

    // Se todas as assinaturas foram concluídas, mover negociação
    if (eventType === "document.finished") {
      await supabase
        .from("negociacoes" as any)
        .update({ stage: "venda_concretizada" })
        .eq("id", contrato.negociacao_id)
        .catch(() => {});

      // Atualizar status do contrato para ativo
      await supabase
        .from("contratos" as any)
        .update({ status: "ativo", autentique_status: "concluido" })
        .eq("id", contrato.id);
    }

    return jsonRes({ ok: true, status: newStatus });
  } catch (err) {
    console.error("autentique-webhook error:", err);
    return jsonRes(
      { ok: false, error: err instanceof Error ? err.message : "Erro interno" },
      500,
    );
  }
});
