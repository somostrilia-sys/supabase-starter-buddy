// CollectPRO — Buscar boletos vencidos no GIA + Disparar cobrança
// Roda no Supabase GIA (mesma infra), chamado pelo CollectPRO frontend

import { getSupabase, corsHeaders, jsonResponse, errorResponse, logSync } from "../_shared/auth.ts";

const META_WABA_ID = "2057526771644703";
const META_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabase();

    if (req.method === "GET") {
      // Buscar boletos vencidos agrupados
      const url = new URL(req.url);
      const dias_min = parseInt(url.searchParams.get("dias_atraso_min") || "5");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - dias_min);

      const { data: boletos, error } = await supabase
        .from("boletos")
        .select(`
          id, valor, vencimento, nosso_numero,
          associados!inner(id, nome, cpf, telefone, email)
        `)
        .eq("status", "aberto")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return errorResponse(error.message, 500);

      return jsonResponse({ success: true, total: (boletos || []).length, data: boletos });
    }

    if (req.method === "POST") {
      // Disparar cobrança
      const { associado_id, boleto_id, canal, template_name, mensagem_custom } = await req.json();

      if (!associado_id || !canal) {
        return errorResponse("associado_id e canal são obrigatórios");
      }

      // Buscar dados do associado
      const { data: assoc } = await supabase
        .from("associados")
        .select("nome, telefone, cpf, email")
        .eq("id", associado_id)
        .single();

      if (!assoc) return errorResponse("Associado não encontrado", 404);

      // Buscar boleto se fornecido
      let boleto: any = null;
      if (boleto_id) {
        const { data } = await supabase
          .from("boletos")
          .select("valor, vencimento, nosso_numero")
          .eq("id", boleto_id)
          .single();
        boleto = data;
      }

      let disparoResult: any = { status: "pending" };

      if (canal === "whatsapp_meta" && META_TOKEN && assoc.telefone) {
        // Disparo via Meta WhatsApp API
        const phone = "55" + assoc.telefone.replace(/\D/g, "");
        const templateBody = {
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: template_name || "cobranca_lembrete",
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: assoc.nome.split(" ")[0] },
                  { type: "text", text: boleto ? `R$ ${Number(boleto.valor).toFixed(2)}` : "em aberto" },
                  { type: "text", text: boleto ? boleto.vencimento : "consulte" },
                ],
              },
            ],
          },
        };

        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${META_WABA_ID}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${META_TOKEN}`,
            },
            body: JSON.stringify(templateBody),
          },
        );

        disparoResult = await metaRes.json();
        disparoResult.canal = "whatsapp_meta";
        disparoResult.status = metaRes.ok ? "sent" : "failed";
      }

      // Registrar disparo no cobranca_status
      await supabase.from("cobranca_status").upsert(
        {
          associado_id,
          boleto_id: boleto_id || null,
          status: "contatado",
          canal,
          ultimo_contato: new Date().toISOString(),
          tentativas: 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "associado_id" },
      );

      await logSync("cobranca_disparo", "collect_pro", "whatsapp_meta", 1, disparoResult.status === "failed" ? 1 : 0, disparoResult.status);

      return jsonResponse({ success: true, disparo: disparoResult, associado: assoc.nome });
    }

    return errorResponse("Method not allowed", 405);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
