/**
 * gia-enviar-notificacao
 * Envio de emails transacionais (cotação, vistoria, assinatura).
 * Usa Resend como provedor de email.
 * Fallback: se RESEND_API_KEY não estiver configurado, loga e retorna sucesso
 * para não bloquear o fluxo principal.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { tipo, email, nome, assunto, mensagem } = await req.json();

    if (!email) return jsonRes({ email: { sucesso: false, detalhes: "Email não informado" } }, 400);
    if (!mensagem) return jsonRes({ email: { sucesso: false, detalhes: "Mensagem não informada" } }, 400);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY não configurada — email não enviado (modo dev)");
      return jsonRes({
        email: {
          sucesso: true,
          detalhes: "Email simulado (RESEND_API_KEY não configurada)",
        },
      });
    }

    // Converter quebras de linha em HTML
    const htmlBody = mensagem
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>")
      .replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" style="color:#1A3A5C;font-weight:bold">$1</a>',
      );

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Objetivo Auto Benefícios <noreply@objetivoauto.com.br>",
        to: [email],
        subject: assunto || "Objetivo Auto Benefícios",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:#1A3A5C;padding:16px 24px;text-align:center">
              <h2 style="color:#fff;margin:0;font-size:18px">Objetivo Auto Benefícios</h2>
            </div>
            <div style="padding:24px;border:1px solid #e5e7eb;border-top:none">
              ${nome ? `<p style="margin:0 0 16px">Olá <strong>${nome}</strong>,</p>` : ""}
              <div style="line-height:1.6;color:#333">${htmlBody}</div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
              <p style="font-size:12px;color:#999;margin:0">
                Este email foi enviado automaticamente pelo sistema Objetivo Auto Benefícios.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend error:", errText);
      return jsonRes({
        email: { sucesso: false, detalhes: `Erro Resend: ${resp.status}` },
      });
    }

    const result = await resp.json();
    return jsonRes({
      email: { sucesso: true, detalhes: `Email enviado (id: ${result.id})` },
    });
  } catch (err) {
    console.error("gia-enviar-notificacao error:", err);
    return jsonRes(
      { email: { sucesso: false, detalhes: err instanceof Error ? err.message : "Erro interno" } },
      500,
    );
  }
});
