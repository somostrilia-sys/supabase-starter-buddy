// GIA: fechamento mensal Trilho Assist → Walk Finance.
// Cron dia 02 às 11:00 UTC (08:00 BRT) — após snapshot deles (dia 01 às 14h BRT).
//
// Endpoints reais Trilho (conforme /fechamento/gerar error response):
//   POST /fechamento/gerar  body: { mes: 'YYYY-MM' }
//   GET  /fechamento/geral?mes=YYYY-MM&formato=json|pdf
//   GET  /fechamento/cooperativa?mes=YYYY-MM
//
// Fluxo:
//   1) POST /fechamento/gerar (garante snapshots)
//   2) GET /fechamento/geral?formato=json  → agregados gerais
//   3) GET /fechamento/geral?formato=pdf   → binário PDF (best-effort)
//   4) GET /fechamento/cooperativa         → lista de coops + itens
//   5) Upsert direto no WF: 1 linha geral + N linhas coop + criar conta_pagar
//
// Secrets: TRILHO_ASSIST_API_URL, TRILHO_ASSIST_TOKEN, OBJETIVO_COMPANY_ID,
//          WF_URL, WF_SERVICE_ROLE_KEY (ou WALK_FINANCE_SERVICE_KEY).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-api-key",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function mesAnteriorRef(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function arrayBufferToBase64(buf: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buf);
  let out = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(out);
}

function nextMonth25th(mesRef: string): string {
  const [y, m] = mesRef.split("-").map(Number);
  const next = new Date(Date.UTC(y, m, 25));
  return next.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const TRILHO_URL = Deno.env.get("TRILHO_ASSIST_API_URL")!;
  const TRILHO_TOKEN = Deno.env.get("TRILHO_ASSIST_TOKEN")!;
  const COMPANY_ID = Deno.env.get("OBJETIVO_COMPANY_ID")!;
  const WF_URL = Deno.env.get("WF_URL") || "https://xytnibnqztjaixemlepb.supabase.co";
  const WF_SERVICE = Deno.env.get("WF_SERVICE_ROLE_KEY") || Deno.env.get("WALK_FINANCE_SERVICE_KEY");

  if (!TRILHO_URL || !TRILHO_TOKEN || !COMPANY_ID || !WF_SERVICE) {
    return json({ error: "secrets ausentes" }, 500);
  }

  const body = await req.json().catch(() => ({}));
  const mesRef: string = body?.mes_referencia || mesAnteriorRef();
  const skipGerar: boolean = !!body?.skip_gerar;

  const headers = { Authorization: `Bearer ${TRILHO_TOKEN}`, "Content-Type": "application/json" };
  const supaWF = createClient(WF_URL, WF_SERVICE);

  // 1. Trigger geração (idempotente no lado deles)
  if (!skipGerar) {
    try {
      await fetch(`${TRILHO_URL}/fechamento/gerar`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mes: mesRef }),
      });
    } catch (e) {
      console.warn("[fech-mensal] /fechamento/gerar falhou, segue:", e);
    }
  }

  // 2. GET geral JSON
  const geralRes = await fetch(`${TRILHO_URL}/fechamento/geral?mes=${mesRef}&formato=json`, { headers });
  if (!geralRes.ok) {
    const txt = await geralRes.text();
    return json({ error: "fechamento/geral?formato=json falhou", status: geralRes.status, body: txt }, 502);
  }
  const geral = await geralRes.json();
  const totalAtendimentos = Number(geral.total_atendimentos || 0);
  const valorBruto = Number(geral.valor_bruto || 0);
  const valorCusto = Number(geral.valor_custo || 0);
  const valorLiquido = Number(geral.valor_liquido || 0);

  // 3. GET PDF (best-effort, pode dar 502 no lado do Matheus)
  let pdfBase64: string | null = null;
  let pdfStoragePath: string | null = null;
  let pdfUrl: string | null = null;
  try {
    const pdfRes = await fetch(`${TRILHO_URL}/fechamento/geral?mes=${mesRef}&formato=pdf`, { headers });
    if (pdfRes.ok && (pdfRes.headers.get("content-type") || "").includes("pdf")) {
      const buf = await pdfRes.arrayBuffer();
      pdfBase64 = await arrayBufferToBase64(buf);
      const path = `${COMPANY_ID}/${mesRef}/fechamento-assistencia-${mesRef}.pdf`;
      const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
      const { error: upErr } = await supaWF.storage
        .from("fechamentos-assistencia")
        .upload(path, bytes, { contentType: "application/pdf", upsert: true });
      if (!upErr) {
        pdfStoragePath = path;
        const { data: sign } = await supaWF.storage
          .from("fechamentos-assistencia")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        pdfUrl = sign?.signedUrl || null;
      }
    } else {
      console.warn("[fech-mensal] PDF indisponível", pdfRes.status);
    }
  } catch (e) {
    console.warn("[fech-mensal] erro download PDF:", e);
  }

  // 4. GET por cooperativa
  const coopRes = await fetch(`${TRILHO_URL}/fechamento/cooperativa?mes=${mesRef}`, { headers });
  const coopData = coopRes.ok ? await coopRes.json() : { cooperativas: [] };
  const coopsArr: any[] = coopData.cooperativas || [];

  // 5. Resolver coop_id por nome (fuzzy: strip FILIAL/Cooperativa + acentos + lower)
  function normalize(s: string): string {
    return (s || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/^\s*(filial|cooperativa|coop)\s+/i, "")
      .toLowerCase()
      .trim();
  }
  const { data: allCoops } = await supaWF
    .from("cooperativas")
    .select("id, nome")
    .eq("company_id", COMPANY_ID);
  const wfCoopsByNorm = new Map<string, string>();
  for (const c of (allCoops || []) as any[]) wfCoopsByNorm.set(normalize(c.nome), c.id);

  const coopMap = new Map<string, string>();
  for (const c of coopsArr) {
    if (!c.cooperativa) continue;
    const matchId = wfCoopsByNorm.get(normalize(c.cooperativa));
    if (matchId) coopMap.set(c.cooperativa, matchId);
  }

  // 6. Reusa conta_pagar existente se já tem pra esse fechamento; senão cria (vencimento dia 25 do mês seguinte)
  let contaPagarId: string | null = null;
  const dataProgramada = nextMonth25th(mesRef);

  // Busca fechamento geral existente pra pegar conta_pagar_id anterior
  const { data: prevFech } = await supaWF
    .from("fechamentos_assistencia_mensal")
    .select("conta_pagar_id")
    .eq("company_id", COMPANY_ID)
    .eq("mes_referencia", mesRef)
    .eq("escopo", "geral")
    .is("cooperativa_id", null)
    .maybeSingle();

  if (prevFech?.conta_pagar_id) {
    // Atualiza valor se mudou
    contaPagarId = prevFech.conta_pagar_id;
    if (valorLiquido > 0) {
      await supaWF
        .from("contas_pagar")
        .update({
          valor: valorLiquido,
          descricao: `Fechamento assistência ${mesRef} (Trilho Assist)`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contaPagarId);
    }
  } else if (valorLiquido > 0) {
    const { data: cp, error: cpErr } = await supaWF
      .from("contas_pagar")
      .insert({
        company_id: COMPANY_ID,
        fornecedor: "Trilho Assist — Assistência 24h",
        descricao: `Fechamento assistência ${mesRef} (Trilho Assist)`,
        valor: valorLiquido,
        vencimento: dataProgramada,
        categoria: "assistencia_24h",
        unidade: "Objetivo",
        status: "programado",
      })
      .select("id")
      .single();
    if (cpErr) console.error("[fech-mensal] conta_pagar erro:", cpErr);
    else contaPagarId = cp.id;
  }

  // 7. Upsert fechamento GERAL
  const { error: fechGeralErr } = await supaWF
    .from("fechamentos_assistencia_mensal")
    .upsert(
      {
        company_id: COMPANY_ID,
        mes_referencia: mesRef,
        escopo: "geral",
        cooperativa_id: null,
        total_atendimentos: totalAtendimentos,
        valor_bruto: valorBruto,
        valor_liquido: valorLiquido,
        pdf_url: pdfUrl,
        pdf_storage_path: pdfStoragePath,
        conta_pagar_id: contaPagarId,
        data_programada_pagamento: dataProgramada,
        status: contaPagarId ? "programado" : "recebido",
        raw_payload: { geral, valor_custo: valorCusto, atendimentos_por_tipo: geral.atendimentos_por_tipo },
        source: "trilho_assist",
        recebido_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,mes_referencia,escopo,cooperativa_id" },
    );
  if (fechGeralErr) {
    return json({ error: "fechamento geral upsert falhou", detail: fechGeralErr.message }, 500);
  }

  // 8. Upsert por cooperativa
  let coopsOk = 0;
  let coopsErr = 0;
  const coopErrSamples: any[] = [];
  for (const c of coopsArr) {
    const coopId = c.cooperativa ? coopMap.get(c.cooperativa) || null : null;
    const { error: cErr } = await supaWF
      .from("fechamentos_assistencia_mensal")
      .upsert(
        {
          company_id: COMPANY_ID,
          mes_referencia: mesRef,
          escopo: "cooperativa",
          cooperativa_id: coopId,
          total_atendimentos: Number(c.total_atendimentos || 0),
          valor_bruto: Number(c.valor_bruto || 0),
          valor_liquido: Number(c.valor_liquido ?? c.valor_bruto ?? 0),
          raw_payload: {
            cooperativa_nome: c.cooperativa,
            valor_custo: c.valor_custo,
            item_count: (c.atendimentos || []).length,
          },
          source: "trilho_assist",
          recebido_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,mes_referencia,escopo,cooperativa_id" },
      );
    if (cErr) {
      coopsErr++;
      if (coopErrSamples.length < 3) coopErrSamples.push({ coop: c.cooperativa, err: cErr.message });
    } else {
      coopsOk++;
    }
  }

  return json({
    success: true,
    mes_referencia: mesRef,
    geral: {
      total_atendimentos: totalAtendimentos,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      pdf_salvo: !!pdfStoragePath,
      conta_pagar_id: contaPagarId,
      data_programada_pagamento: dataProgramada,
    },
    cooperativas: {
      total: coopsArr.length,
      matched_no_wf: coopMap.size,
      ok: coopsOk,
      erros: coopsErr,
      amostra_erros: coopErrSamples,
    },
  });
});
