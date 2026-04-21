// gia-sga-enriquecer-historico
// Enriquece boletos (linha digitável, PIX, link) e baixa PDF pro bucket sga-boletos.
// Varre TODOS boletos (aberto + baixado) desde `since`.
// Idempotente: reprocessa só quem falta linha OU pdf_storage_path.
// Input: { since?: "YYYY-MM-DD", until?: "YYYY-MM-DD", limit?: 200, reauth_each?: 5, skip_pdf?: false }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SGA_BASE = "https://api.hinova.com.br/api/sga/v2";
const SGA_TOKEN = Deno.env.get("SGA_HINOVA_TOKEN")!;
const SGA_LOGIN = Deno.env.get("SGA_LOGIN")!;
const SGA_SENHA = Deno.env.get("SGA_SENHA")!;

async function authSga() {
  const r = await fetch(`${SGA_BASE}/usuario/autenticar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SGA_TOKEN}`,
      "api_token": SGA_TOKEN,
    },
    body: JSON.stringify({ usuario: SGA_LOGIN, senha: SGA_SENHA }),
  });
  const d = await r.json();
  const tu = d.token_usuario || d.token;
  if (!tu) throw new Error(`Auth SGA falhou: ${JSON.stringify(d).slice(0, 200)}`);
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${tu}`,
    "api_token": SGA_TOKEN,
    "token_usuario": tu,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const t0 = Date.now();
  try {
    const {
      since = "2025-01-01",
      until = new Date().toISOString().slice(0, 10),
      limit = 200,
      reauth_each = 5,
      skip_pdf = false,
    } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Só enriquece ABERTOS (não pagos). Pagos/baixados o SGA não devolve PDF mesmo
    // e o histórico financeiro do pago já está completo via metadados do sync.
    const { data: boletos, error: qErr } = await supabase
      .from("boletos")
      .select("id, nosso_numero, codigo_sga, vencimento, linha_digitavel, pdf_storage_path")
      .not("nosso_numero", "is", null)
      .gte("vencimento", since)
      .lte("vencimento", until)
      .is("data_pagamento", null)
      .neq("status", "baixado")
      .neq("status", "pago")
      .is("pdf_storage_path", null)
      .order("vencimento", { ascending: false })
      .limit(limit);

    if (qErr) throw qErr;
    const lista = boletos || [];
    if (lista.length === 0) {
      return new Response(
        JSON.stringify({ sucesso: true, processados: 0, remaining: 0, ms: Date.now() - t0 }),
        { headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    let headers = await authSga();
    let enriquecidos = 0, pdf_ok = 0, sem_dado = 0, erros = 0;
    const amostra: any[] = [];

    for (let i = 0; i < lista.length; i++) {
      const b = lista[i];
      if (i > 0 && i % reauth_each === 0) {
        try { headers = await authSga(); } catch (_e) { /* tenta seguir */ }
      }

      try {
        // 1. Buscar dados do boleto
        let r = await fetch(`${SGA_BASE}/buscar/boleto/${b.nosso_numero}`, { headers });
        if (r.status === 401) {
          headers = await authSga();
          r = await fetch(`${SGA_BASE}/buscar/boleto/${b.nosso_numero}`, { headers });
        }

        let dados: any = {};
        if (r.ok) {
          dados = await r.json();
        } else {
          erros++;
          if (amostra.length < 5) amostra.push({ nn: b.nosso_numero, http: r.status });
          continue;
        }

        const bo = Array.isArray(dados) ? dados[0] : dados;
        const linha = bo?.linha_digitavel || "";
        const link = bo?.link_boleto || bo?.short_link || "";
        const pixObj = bo?.pix;
        const pix = typeof pixObj === "string" ? pixObj : (pixObj?.copia_cola || pixObj?.copiaCola || pixObj?.qr_code || "");
        const pix_qr = typeof pixObj === "object" ? (pixObj?.qrcode || pixObj?.qr_code || pixObj?.imagem || "") : "";
        const situacao = String(bo?.codigo_situacao_boleto || "");

        if (!linha && !link) {
          sem_dado++;
          // Sentinel "" quebra loop (baixados/EXCLUIDO 999 nunca retornam link no SGA)
          await supabase.from("boletos").update({
            linha_digitavel: linha || "",
            link_boleto: "",
            pdf_url: "",
            pdf_storage_path: "",
            codigo_situacao_sga: situacao || null,
          }).eq("id", b.id);
          continue;
        }

        // 2. Baixar PDF e upload bucket
        let pdf_path: string | null = b.pdf_storage_path || null;
        if (!skip_pdf && link && !pdf_path) {
          try {
            const pdfRes = await fetch(link, { redirect: "follow" });
            if (pdfRes.ok && pdfRes.headers.get("content-type")?.includes("pdf")) {
              const buf = new Uint8Array(await pdfRes.arrayBuffer());
              const year = (b.vencimento || "").slice(0, 4) || "unknown";
              const fname = b.codigo_sga || b.id;
              const path = `boletos/${year}/${fname}.pdf`;
              const up = await supabase.storage
                .from("sga-boletos")
                .upload(path, buf, { contentType: "application/pdf", upsert: true });
              if (!up.error) {
                pdf_path = path;
                pdf_ok++;
              }
            }
          } catch (_e) { /* falha upload não bloqueia o resto */ }
        }

        // 3. Gravar — pdf_storage_path sempre não-null (sentinel "" se não upou)
        const patch: any = {
          linha_digitavel: linha || "",
          link_boleto: link || "",
          pdf_url: link || "",
          pdf_storage_path: pdf_path || "",
        };
        if (pix) patch.pix_copia_cola = pix;
        if (pix_qr) patch.pix_qrcode = pix_qr;
        if (situacao) patch.codigo_situacao_sga = situacao;

        await supabase.from("boletos").update(patch).eq("id", b.id);
        enriquecidos++;
        if (amostra.length < 3) amostra.push({ nn: b.nosso_numero, linha: !!linha, pdf: !!pdf_path });
      } catch (e: any) {
        erros++;
        if (amostra.length < 5) amostra.push({ nn: b.nosso_numero, erro: e.message?.slice(0, 100) });
      }
    }

    const { count: remaining } = await supabase
      .from("boletos")
      .select("id", { count: "exact", head: true })
      .not("nosso_numero", "is", null)
      .gte("vencimento", since)
      .lte("vencimento", until)
      .is("data_pagamento", null)
      .neq("status", "baixado")
      .neq("status", "pago")
      .is("pdf_storage_path", null);

    return new Response(
      JSON.stringify({
        sucesso: true,
        processados: lista.length,
        enriquecidos,
        pdf_ok,
        sem_dado,
        erros,
        remaining,
        ms: Date.now() - t0,
        amostra,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ sucesso: false, erro: e.message, ms: Date.now() - t0 }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
